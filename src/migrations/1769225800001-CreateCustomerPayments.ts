import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerPayments1769225800001 implements MigrationInterface {
  name = 'CreateCustomerPayments1769225800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "customer_payments" (
      "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      "customerId" uuid NOT NULL,
      "amount" decimal(12,2) NOT NULL,
      "paidAt" timestamptz NOT NULL,
      "paymentMethod" varchar(100),
      "balanceAfter" decimal(12,2) NOT NULL,
      "note" text,
      "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await queryRunner.query(
      `ALTER TABLE "customer_payments" ADD CONSTRAINT "FK_customer_payments_customer" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer_payments" DROP CONSTRAINT IF EXISTS "FK_customer_payments_customer"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_payments"`);
  }
}
