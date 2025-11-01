import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDescriptionToExpense1759029740426 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'expense',
      new TableColumn({
        name: 'description',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('expense', 'description');
  }
}