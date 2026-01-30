import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateSupplierOrders1769225900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'supplier_orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'supplierId', type: 'uuid' },
          { name: 'companyId', type: 'uuid' },
          { name: 'orderCode', type: 'varchar', isUnique: true },
          { name: 'status', type: 'varchar', default: `'recibido'` },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          { name: 'invoiceUrl', type: 'varchar', isNullable: true },
          {
            name: 'invoiceFilename',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'invoiceMime',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          { name: 'invoiceSize', type: 'bigint', isNullable: true },
          { name: 'invoiceUploadedAt', type: 'timestamptz', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'supplier_orders',
      new TableForeignKey({
        columnNames: ['supplierId'],
        referencedTableName: 'suppliers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'supplier_orders',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'supplier_order_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'orderId', type: 'uuid' },
          { name: 'productId', type: 'uuid' },
          { name: 'quantity', type: 'int' },
          { name: 'unitPrice', type: 'decimal', precision: 12, scale: 2 },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'supplier_order_items',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'supplier_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableItems = await queryRunner.getTable('supplier_order_items');
    const fkItem = tableItems?.foreignKeys.find(
      (f) => f.columnNames.indexOf('orderId') !== -1,
    );
    if (fkItem)
      await queryRunner.dropForeignKey('supplier_order_items', fkItem);
    await queryRunner.dropTable('supplier_order_items', true);

    const table = await queryRunner.getTable('supplier_orders');
    const fk1 = table?.foreignKeys.find(
      (f) => f.columnNames.indexOf('supplierId') !== -1,
    );
    if (fk1) await queryRunner.dropForeignKey('supplier_orders', fk1);
    const fk2 = table?.foreignKeys.find(
      (f) => f.columnNames.indexOf('companyId') !== -1,
    );
    if (fk2) await queryRunner.dropForeignKey('supplier_orders', fk2);
    await queryRunner.dropTable('supplier_orders', true);
  }
}
