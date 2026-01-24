import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDescriptionToIncome1759029740425 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'income',
      new TableColumn({
        name: 'description',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('income', 'description');
  }
}
