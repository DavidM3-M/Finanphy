import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrderInvoiceColumns1769223200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('client_orders', [
      new TableColumn({
        name: 'invoiceUrl',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'invoiceFilename',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'invoiceMime',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'invoiceSize',
        type: 'bigint',
        isNullable: true,
      }),
      new TableColumn({
        name: 'invoiceUploadedAt',
        type: 'timestamptz',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('client_orders', 'invoiceUploadedAt');
    await queryRunner.dropColumn('client_orders', 'invoiceSize');
    await queryRunner.dropColumn('client_orders', 'invoiceMime');
    await queryRunner.dropColumn('client_orders', 'invoiceFilename');
    await queryRunner.dropColumn('client_orders', 'invoiceUrl');
  }
}
