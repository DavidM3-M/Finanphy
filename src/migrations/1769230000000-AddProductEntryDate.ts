import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProductEntryDate1769230000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('product', 'entryDate'))) {
      await queryRunner.addColumn(
        'product',
        new TableColumn({
          name: 'entryDate',
          type: 'timestamptz',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('product', 'entryDate')) {
      await queryRunner.dropColumn('product', 'entryDate');
    }
  }
}
