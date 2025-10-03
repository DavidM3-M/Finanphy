import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorCompaniesIdToUuid1758945274914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Asumimos que pgcrypto está activo (gen_random_uuid)
    
    // 2) Agregar columna temporal con UUID
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "temp_id" UUID DEFAULT gen_random_uuid();
    `);

    // 3) Backfill: actualizar companyId en tablas hijas
    const children = [
      'product',
      'income',
      'expense',
      'investment',
      'client_orders',
    ];
    for (const table of children) {
      if (await queryRunner.hasTable(table)) {
        await queryRunner.query(`
          UPDATE "${table}" AS child
          SET "companyId" = c."temp_id"
          FROM "companies" AS c
          WHERE child."companyId" = c."id";
        `);
      }
    }

    // 4) Dropear todas las FKs que apuntan a companies(id)
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

    // 5) Dropear PK y columna id antigua
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_pkey";
      ALTER TABLE "companies" DROP COLUMN "id";
    `);

    // 6) Renombrar temp_id → id y restablecer PK
    await queryRunner.query(`
      ALTER TABLE "companies" RENAME COLUMN "temp_id" TO "id";
      ALTER TABLE "companies" ADD PRIMARY KEY ("id");
    `);

    // 7) Recrear FKs en cada tabla hija
    for (const table of children) {
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