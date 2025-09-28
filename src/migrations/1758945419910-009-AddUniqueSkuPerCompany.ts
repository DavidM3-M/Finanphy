import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueSkuPerCompany1758945419910 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product"
      ADD CONSTRAINT "UQ_product_sku_company" UNIQUE ("sku", "companyId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product"
      DROP CONSTRAINT "UQ_product_sku_company"
    `);
  }
}