import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentStatusToClientOrders1769300000000 implements MigrationInterface {
  name = 'AddPaymentStatusToClientOrders1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_orders" ADD COLUMN IF NOT EXISTS "paymentStatus" varchar(20) NOT NULL DEFAULT 'pendiente'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "client_orders" DROP COLUMN IF EXISTS "paymentStatus"`);
  }
}
