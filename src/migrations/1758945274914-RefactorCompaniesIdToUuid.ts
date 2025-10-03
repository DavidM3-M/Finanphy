import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorCompaniesIdToUuid1758945274914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Asegurar gen_random_uuid() de pgcrypto
    // (asumimos que ya existe, omitimos CREATE EXTENSION)

    // 2) Añadir columna temporal con gen_random_uuid()
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "temp_id" UUID DEFAULT gen_random_uuid();
    `);

    // 3) Eliminar todas las FKs que referencian companies(id)
    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN (
          SELECT conrelid::regclass::text AS tbl,
                 conname
          FROM pg_constraint
          WHERE contype = 'f'
            AND confrelid = 'companies'::regclass
        ) LOOP
          EXECUTE format('ALTER TABLE "%s" DROP CONSTRAINT "%s"', r.tbl, r.conname);
        END LOOP;
      END
      $$;
    `);

    // 4) Dropear PK y columna id antigua
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_pkey";
      ALTER TABLE "companies" DROP COLUMN "id";
    `);

    // 5) Renombrar y marcar PK
    await queryRunner.query(`
      ALTER TABLE "companies" RENAME COLUMN "temp_id" TO "id";
      ALTER TABLE "companies" ADD PRIMARY KEY ("id");
    `);

    // 6) Recrear manualmente las FKs
    await queryRunner.query(`
      ALTER TABLE "client_orders"
        ADD FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
      ALTER TABLE "product"
        ADD FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
      ALTER TABLE "income"
        ADD FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
      ALTER TABLE "expense"
        ADD FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
      ALTER TABLE "investment"
        ADD FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
    `);
  }

  public async down(): Promise<void> {
    throw new Error('Rollback manual requerido');
  }
}