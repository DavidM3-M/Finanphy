import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddUserRelationToClientOrders1759029740421
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Agregar columna userId (nullable inicialmente)
    await queryRunner.addColumn(
      'client_orders',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // 2) Backfill: para cada orden existente asignar userId = company.userId
    await queryRunner.query(`
      UPDATE "client_orders" co
      SET "userId" = c."userId"
      FROM "companies" c
      WHERE c.id = co."companyId";
    `);

    // 3) Marcar userId como NOT NULL tras el backfill
    await queryRunner.changeColumn(
      'client_orders',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // 4) Crear FK apuntando a user_entity(id)
    await queryRunner.createForeignKey(
      'client_orders',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user_entity',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1) Eliminar la FK si existe
    const table = await queryRunner.getTable('client_orders');
    if (table) {
      const fk = table.foreignKeys.find((fk) =>
        fk.columnNames.includes('userId'),
      );
      if (fk) {
        await queryRunner.dropForeignKey('client_orders', fk);
      }
    }

    // 2) Eliminar la columna userId
    await queryRunner.dropColumn('client_orders', 'userId');
  }
}
