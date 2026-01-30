import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateSuppliers1769225800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'suppliers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'name', type: 'varchar' },
          { name: 'email', type: 'varchar', isNullable: true },
          { name: 'phone', type: 'varchar', isNullable: true },
          { name: 'contact', type: 'varchar', isNullable: true },
          { name: 'address', type: 'varchar', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'companyId', type: 'uuid' },
          {
            name: 'debt',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'credit',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: '0',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'suppliers',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('suppliers');
    const fk = table?.foreignKeys.find(
      (f) => f.columnNames.indexOf('companyId') !== -1,
    );
    if (fk) await queryRunner.dropForeignKey('suppliers', fk);
    await queryRunner.dropTable('suppliers', true);
  }
}
