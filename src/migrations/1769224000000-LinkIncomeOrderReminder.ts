import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class LinkIncomeOrderReminder1769224000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'income',
      new TableColumn({
        name: 'orderId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'income',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'client_orders',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.addColumns('reminders', [
      new TableColumn({
        name: 'incomeId',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'orderId',
        type: 'uuid',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKey(
      'reminders',
      new TableForeignKey({
        columnNames: ['incomeId'],
        referencedTableName: 'income',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'reminders',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'client_orders',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const remindersTable = await queryRunner.getTable('reminders');
    if (remindersTable) {
      for (const fk of remindersTable.foreignKeys) {
        if (fk.columnNames.includes('incomeId')) {
          await queryRunner.dropForeignKey('reminders', fk);
        }
        if (fk.columnNames.includes('orderId')) {
          await queryRunner.dropForeignKey('reminders', fk);
        }
      }
    }

    await queryRunner.dropColumn('reminders', 'orderId');
    await queryRunner.dropColumn('reminders', 'incomeId');

    const incomeTable = await queryRunner.getTable('income');
    if (incomeTable) {
      const fk = incomeTable.foreignKeys.find((key) =>
        key.columnNames.includes('orderId'),
      );
      if (fk) {
        await queryRunner.dropForeignKey('income', fk);
      }
    }

    await queryRunner.dropColumn('income', 'orderId');
  }
}
