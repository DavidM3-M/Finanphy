import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEvidenceFieldsToCustomerPayments1769300000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('customer_payments', [
      new TableColumn({ name: 'evidenceFilename', type: 'varchar', length: '255', isNullable: true }),
      new TableColumn({ name: 'evidenceMime', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'evidenceSize', type: 'bigint', isNullable: true }),
      new TableColumn({ name: 'evidenceUploadedAt', type: 'timestamptz', isNullable: true }),
      new TableColumn({ name: 'evidenceUrl', type: 'varchar', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customer_payments', 'evidenceUrl');
    await queryRunner.dropColumn('customer_payments', 'evidenceUploadedAt');
    await queryRunner.dropColumn('customer_payments', 'evidenceSize');
    await queryRunner.dropColumn('customer_payments', 'evidenceMime');
    await queryRunner.dropColumn('customer_payments', 'evidenceFilename');
  }
}
