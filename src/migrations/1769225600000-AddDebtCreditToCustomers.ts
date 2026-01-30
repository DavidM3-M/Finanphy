import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDebtCreditToCustomers1769225600000
  implements MigrationInterface
{
  name = 'AddDebtCreditToCustomers1769225600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "debt" decimal(12,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "credit" decimal(12,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "credit"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "debt"`);
  }
}
