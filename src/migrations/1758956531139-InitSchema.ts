import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1758956531139 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ENUMS blindados
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_entity_role_enum') THEN
          CREATE TYPE "user_entity_role_enum" AS ENUM('admin', 'user', 'client', 'seller');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_orders_status_enum') THEN
          CREATE TYPE "client_orders_status_enum" AS ENUM('recibido', 'en_proceso', 'enviado');
        END IF;
      END
      $$;
    `);

    // USER ENTITY
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_entity" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL UNIQUE,
        "password" varchar NOT NULL,
        "role" "user_entity_role_enum" NOT NULL DEFAULT 'user'
      )
    `);

    // COMPANIES
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "companies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "userId" uuid,
        CONSTRAINT "FK_companies_userId" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE
      )
    `);

    // PRODUCT
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "sku" varchar NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "companyId" uuid NOT NULL,
        CONSTRAINT "FK_product_companyId" FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_sku_company" ON "product" ("sku", "companyId")`,
    );

    // CLIENT ORDERS
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "status" "client_orders_status_enum" NOT NULL DEFAULT 'recibido',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "orderCode" varchar NOT NULL UNIQUE,
        "companyId" uuid,
        CONSTRAINT "FK_client_orders_companyId" FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      )
    `);

    // CLIENT ORDER ITEMS
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_order_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(12,2) NOT NULL,
        CONSTRAINT "FK_client_order_items_orderId" FOREIGN KEY ("orderId") REFERENCES "client_orders"("id"),
        CONSTRAINT "FK_client_order_items_productId" FOREIGN KEY ("productId") REFERENCES "product"("id")
      )
    `);

    // INCOME
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "income" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "amount" numeric(12,2) NOT NULL,
        "companyId" uuid NOT NULL,
        CONSTRAINT "FK_income_companyId" FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      )
    `);

    // EXPENSE
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expense" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "amount" numeric(12,2) NOT NULL,
        "companyId" uuid NOT NULL,
        CONSTRAINT "FK_expense_companyId" FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      )
    `);

    // INVESTMENT
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "investment" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "amount" numeric(12,2) NOT NULL,
        "companyId" uuid NOT NULL,
        CONSTRAINT "FK_investment_companyId" FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "investment"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "income"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_orders"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_product_sku_company"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_entity"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "client_orders_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_entity_role_enum"`);
  }
}
