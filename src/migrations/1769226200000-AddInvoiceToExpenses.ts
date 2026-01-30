import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoiceToExpenses1769226200000 implements MigrationInterface {
  name = 'AddInvoiceToExpenses1769226200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expense" ADD "invoiceUrl" varchar NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD "invoiceFilename" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD "invoiceMime" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD "invoiceSize" bigint NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" ADD "invoiceUploadedAt" timestamptz NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expense" DROP COLUMN "invoiceUploadedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" DROP COLUMN "invoiceSize"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" DROP COLUMN "invoiceMime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" DROP COLUMN "invoiceFilename"`,
    );
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "invoiceUrl"`);
  }
}
