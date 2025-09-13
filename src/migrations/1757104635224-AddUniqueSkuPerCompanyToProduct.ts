import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueSkuPerCompanyToProduct1694481234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'UQ_product_sku_company'
        ) THEN
          CREATE UNIQUE INDEX "UQ_product_sku_company" ON "product"(sku, "companyId");
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_product_sku_company";
    `);
  }
}