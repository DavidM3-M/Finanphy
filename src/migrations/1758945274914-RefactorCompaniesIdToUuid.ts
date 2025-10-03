import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorCompaniesIdToUuid1758945274914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Asegurar extensión para generar UUID
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    );

    // 2) Añadir columna temporal con UUID auto­generado
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "temp_id" UUID DEFAULT uuid_generate_v4();
    `);

    // 3) (Opcional) backfill desde el id numérico si necesitas trazabilidad
    // await queryRunner.query(`
    //   UPDATE "companies"
    //   SET "temp_id" = -- algún mapeo o UUID fijo
    // `);

    // 4) Dropear dinámicamente la FK en client_orders → companies(companyId)
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT tc.constraint_name
        INTO fk_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE
          tc.table_name = 'client_orders'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'companyId';
        IF fk_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "client_orders" DROP CONSTRAINT %I', fk_name);
        END IF;
      END
      $$;
    `);

    // 5) Dropear la PK antigua y columna id
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_pkey";
      ALTER TABLE "companies" DROP COLUMN "id";
    `);

    // 6) Renombrar temp_id → id y hacerla PRIMARY KEY
    await queryRunner.query(`
      ALTER TABLE "companies" RENAME COLUMN "temp_id" TO "id";
      ALTER TABLE "companies" ADD PRIMARY KEY ("id");
    `);

    // 7) Recrear la FK client_orders.companyId → companies.id
    await queryRunner.query(`
      ALTER TABLE "client_orders"
      ADD FOREIGN KEY ("companyId")
      REFERENCES "companies"("id")
      ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback manual recomendado
    throw new Error(
      'Rollback manual requerido para RefactorCompaniesIdToUuid1758945274914'
    );
  }
}