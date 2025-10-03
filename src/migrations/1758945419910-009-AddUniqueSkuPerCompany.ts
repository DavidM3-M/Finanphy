import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueSkuPerCompany1758945419910 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Borrar la constraint si ya existiera
    await queryRunner.query(`
      ALTER TABLE "product"
      DROP CONSTRAINT IF EXISTS "UQ_product_sku_company";
    `);

    // 2) Crear la constraint única de sku + companyId
    await queryRunner.query(`
      ALTER TABLE "product"
      ADD CONSTRAINT "UQ_product_sku_company"
      UNIQUE ("sku", "companyId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Al revertir, simplemente eliminar la constraint
    await queryRunner.query(`
      ALTER TABLE "product"
      DROP CONSTRAINT IF EXISTS "UQ_product_sku_company";
    `);
  }
}