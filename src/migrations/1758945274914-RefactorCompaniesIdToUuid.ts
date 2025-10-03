import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';

export class RefactorCompaniesIdToUuid1758945274914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Crear columna temporal
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "temp_id" UUID;
    `);

    // 2) Leer todos los IDs actuales
    const companies: { id: string }[] = await queryRunner.query(`
      SELECT id FROM "companies";
    `);

    // 3) Para cada company, generar UUID y backfillear compañías + tablas hijas
    for (const { id: oldId } of companies) {
      const newId = randomUUID();

      // 3a) Asignar temp_id en companies
      await queryRunner.query(
        `UPDATE "companies" SET "temp_id" = $1 WHERE id = $2`,
        [newId, oldId],
      );

      // 3b) Actualizar FK en tablas que usan companyId
      const children = ['product', 'income', 'expense', 'investment', 'client_orders'];
      for (const table of children) {
        if (await queryRunner.hasTable(table)) {
          await queryRunner.query(
            `UPDATE "${table}" SET "companyId" = $1 WHERE "companyId" = $2`,
            [newId, oldId],
          );
        }
      }
    }

    // 4) Dropear todas las FKs antiguas que referencian companies(id)
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

    // 5) Eliminar PK y columna antigua
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_pkey";
      ALTER TABLE "companies" DROP COLUMN "id";
    `);

    // 6) Renombrar temp_id → id y establecer PK
    await queryRunner.query(`
      ALTER TABLE "companies" RENAME COLUMN "temp_id" TO "id";
      ALTER TABLE "companies" ADD PRIMARY KEY ("id");
    `);

    // 7) Recrear FKs en cada tabla hija
    const children = ['product', 'income', 'expense', 'investment', 'client_orders'];
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