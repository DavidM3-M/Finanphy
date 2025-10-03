import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProducts1758945332124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'name', type: 'varchar' },
          { name: 'sku', type: 'varchar' },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          { name: 'description', type: 'varchar', isNullable: true },
          { name: 'category', type: 'varchar', isNullable: true },
          { name: 'imageUrl', type: 'varchar', isNullable: true },
          { name: 'price', type: 'decimal', precision: 12, scale: 2 },
          { name: 'cost', type: 'decimal', precision: 12, scale: 2 },
          { name: 'isPublic', type: 'boolean', default: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'stock', type: 'int', default: 0 },
          { name: 'companyId', type: 'uuid' },
        ],
        indices: [
          {
            columnNames: ['sku', 'companyId'],
            isUnique: true,
          },
          {
            columnNames: ['companyId'],
            name: 'idx_product_company',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['companyId'],
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product', true);
  }
}