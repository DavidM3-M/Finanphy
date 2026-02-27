import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderIdToCustomerPayments1769230200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS "orderId" uuid`,
    );
    await queryRunner.query(
      `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_customer_payments_order') THEN\n    ALTER TABLE customer_payments ADD CONSTRAINT "FK_customer_payments_order" FOREIGN KEY ("orderId") REFERENCES client_orders(id) ON DELETE SET NULL;\n  END IF;\nEND$$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE customer_payments DROP CONSTRAINT IF EXISTS "FK_customer_payments_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE customer_payments DROP COLUMN IF EXISTS "orderId"`,
    );
  }
}
