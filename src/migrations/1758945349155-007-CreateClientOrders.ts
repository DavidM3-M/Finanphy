import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateClientOrders1758945349155 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'client_orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'orderCode',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'companyId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['recibido', 'en_proceso', 'enviado'],
            default:`'recibido'`, 
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
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
    await queryRunner.dropTable('client_orders', true);
  }
}