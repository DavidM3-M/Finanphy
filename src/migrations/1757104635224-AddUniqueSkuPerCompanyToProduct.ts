import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueSkuPerCompanyToProduct1757104635224 implements MigrationInterface {
  name = 'AddUniqueSkuPerCompanyToProduct1757104635224';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Asegurar columna companyId
    const hasColumn = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'product'
        AND column_name = 'companyId';
    `);
    if (hasColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "product"
        ADD COLUMN "companyId" UUID;
      `);
    }

    // 2. Asegurar FK product → companies
    const hasFk = await queryRunner.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'product'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'FK_product_companyId';
    `);
    if (hasFk.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "product"
        ADD CONSTRAINT "FK_product_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }

    // 3. Crear índice único si no existe
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'product'
            AND indexname = 'UQ_product_sku_company'
        ) THEN
          CREATE UNIQUE INDEX "UQ_product_sku_company"
          ON "product"(sku, "companyId");
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Solo eliminamos el índice y la FK; dejamos la columna por compatibilidad
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_product_sku_company";
    `);
    await queryRunner.query(`
      ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "FK_product_companyId";
    `);
  }
}