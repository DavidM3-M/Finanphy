import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToClientOrders1670000000000
  implements MigrationInterface
{
  name = 'AddDescriptionToClientOrders1670000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_orders" ADD "description" varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_orders" DROP COLUMN "description"`,
    );
  }
}
