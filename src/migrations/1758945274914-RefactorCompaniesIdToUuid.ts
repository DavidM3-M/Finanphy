import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorCompaniesIdToUuid1758945274914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Asumimos que pgcrypto ya está activo en Render (gen_random_uuid)
    
    // 2) Agregar columna temporal con UUID
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "temp_id" UUID DEFAULT gen_random_uuid();
    `);

    // 3) Dropear dinámicamente todas las FKs que apunten a companies(id)
    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN (
          SELECT conrelid::regclass::text AS tbl, conname
          FROM pg_constraint
          WHERE contype = 'f'
            AND confrelid = 'companies'::regclass
        ) LOOP
          EXECUTE format('ALTER TABLE "%s" DROP CONSTRAINT "%s"', r.tbl, r.conname);
        END LOOP;
      END
      $$;
    `);

    // 4) Dropear PK y columna vieja
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_pkey";
      ALTER TABLE "companies" DROP COLUMN "id";
    `);

    // 5) Renombrar temp_id → id y volverla PK
    await queryRunner.query(`
      ALTER TABLE "companies" RENAME COLUMN "temp_id" TO "id";
      ALTER TABLE "companies" ADD PRIMARY KEY ("id");
    `);

    // 6) Volver a crear FKs solo si existe cada tabla relacionada
    const related = [
      'client_orders',
      'product',
      'income',
      'expense',
      'investment',
    ];
    for (const table of related) {
      if (await queryRunner.hasTable(table)) {
        await queryRunner.query(`
          ALTER TABLE "${table}"
          ADD FOREIGN KEY ("companyId")
          REFERENCES "companies"("id")
          ON DELETE CASCADE;
        `);
      }
    }
  }

  public async down(): Promise<void> {
    throw new Error('Rollback manual requerido');
  }
}