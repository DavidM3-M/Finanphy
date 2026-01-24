import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProductImageColumns1769222000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product', [
      new TableColumn({
        name: 'image_data',
        type: 'bytea',
        isNullable: true,
      }),
      new TableColumn({
        name: 'image_filename',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'image_mime',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'image_size',
        type: 'bigint',
        isNullable: true,
      }),
      new TableColumn({
        name: 'image_uploaded_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product', 'image_uploaded_at');
    await queryRunner.dropColumn('product', 'image_size');
    await queryRunner.dropColumn('product', 'image_mime');
    await queryRunner.dropColumn('product', 'image_filename');
    await queryRunner.dropColumn('product', 'image_data');
  }
}
