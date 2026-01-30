import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerIdToIncome1769225700000 implements MigrationInterface {
  name = 'AddCustomerIdToIncome1769225700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "income" ADD "customerId" uuid NULL`);
    await queryRunner.query(
      `ALTER TABLE "income" ADD CONSTRAINT "FK_income_customer" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "income" DROP CONSTRAINT "FK_income_customer"`,
    );
    await queryRunner.query(`ALTER TABLE "income" DROP COLUMN "customerId"`);
  }
}
