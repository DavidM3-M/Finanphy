import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateClientOrderItems1758945384493 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'client_order_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'orderId',
            type: 'uuid',
          },
          {
            name: 'productId',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'unitPrice',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('client_order_items', [
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'client_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['productId'],
        referencedTableName: 'product',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('client_order_items');
    if (table) {
      const foreignKeys = table.foreignKeys.filter(fk =>
        ['orderId', 'productId'].includes(fk.columnNames[0]),
      );
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('client_order_items', fk);
      }
    }

    await queryRunner.dropTable('client_order_items', true);
  }
}