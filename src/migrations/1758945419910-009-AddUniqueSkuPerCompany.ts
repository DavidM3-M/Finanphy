import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueSkuPerCompany1758945419910 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Eliminar índice si existe (evita el “relation … already exists”)
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_product_sku_company";
    `);

    // 2) Eliminar constraint si existe
    await queryRunner.query(`
      ALTER TABLE "product"
      DROP CONSTRAINT IF EXISTS "UQ_product_sku_company";
    `);

    // 3) Crear la unique constraint (y su índice asociado)
    await queryRunner.query(`
      ALTER TABLE "product"
      ADD CONSTRAINT "UQ_product_sku_company"
      UNIQUE ("sku", "companyId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1) Eliminar índice si existe
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_product_sku_company";
    `);

    // 2) Eliminar constraint si existe
    await queryRunner.query(`
      ALTER TABLE "product"
      DROP CONSTRAINT IF EXISTS "UQ_product_sku_company";
    `);
  }
}
