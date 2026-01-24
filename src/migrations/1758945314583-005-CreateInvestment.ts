import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateInvestment1758945314583 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'investment',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'invoicenumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'entryDate',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'exitDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'dueDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'companyId',
            type: 'uuid',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'investment',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('investment');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) =>
        fk.columnNames.includes('companyId'),
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('investment', foreignKey);
      }
    }

    await queryRunner.dropTable('investment', true);
  }
}
