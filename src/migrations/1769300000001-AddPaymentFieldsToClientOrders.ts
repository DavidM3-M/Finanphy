import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentFieldsToClientOrders1769300000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('client_orders', [
      new TableColumn({
        name: 'paidAmount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'paymentMethod',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'paymentAt',
        type: 'timestamptz',
        isNullable: true,
      }),
      new TableColumn({
        name: 'balanceAfter',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('client_orders', 'balanceAfter');
    await queryRunner.dropColumn('client_orders', 'paymentAt');
    await queryRunner.dropColumn('client_orders', 'paymentMethod');
    await queryRunner.dropColumn('client_orders', 'paidAmount');
  }
}
