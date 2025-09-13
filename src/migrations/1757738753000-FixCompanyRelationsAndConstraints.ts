import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCompanyRelationsAndConstraints1757105000000 implements MigrationInterface {
  name = 'FixCompanyRelationsAndConstraints1757105000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PRODUCT: Verificar columna companyId
    const productColumn = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'product' AND column_name = 'companyId'
    `);

    if (productColumn.length === 0) {
      await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "companyId" UUID`);
    }

    // PRODUCT: Verificar FK
    const productFK = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'product' AND constraint_type = 'FOREIGN KEY'
    `);

    if (!productFK.some((row: any) => row.constraint_name === 'FK_product_companyId')) {
      await queryRunner.query(`
        ALTER TABLE "product"
        ADD CONSTRAINT "FK_product_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    }

    // INCOME: Verificar columna companyId
    const incomeColumn = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'income' AND column_name = 'companyId'
    `);

    if (incomeColumn.length === 0) {
      await queryRunner.query(`ALTER TABLE "income" ADD COLUMN "companyId" UUID`);
    }

    // INCOME: Verificar FK
    const incomeFK = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'income' AND constraint_type = 'FOREIGN KEY'
    `);

    if (!incomeFK.some((row: any) => row.constraint_name === 'FK_income_companyId')) {
      await queryRunner.query(`
        ALTER TABLE "income"
        ADD CONSTRAINT "FK_income_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    }

    // Repite el patrón para expense, investment, etc. si lo deseas
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "FK_product_companyId"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT IF EXISTS "FK_income_companyId"`);
    // No eliminamos columnas en down por seguridad
  }
}