import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchemaExtended1757104635223 implements MigrationInterface {
  name = 'InitSchemaExtended1757104635223';

  public async up(queryRunner: QueryRunner): Promise<void> {
    //
    // 1. user_entity
    //
    const userEntityExists = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_entity'
      ) AS "exists"
    `))[0].exists;

    if (!userEntityExists) {
      await queryRunner.query(`
        CREATE TABLE "user_entity" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "firstName" varchar NOT NULL,
          "lastName" varchar NOT NULL,
          "email" varchar NOT NULL UNIQUE,
          "password" varchar NOT NULL,
          "role" varchar NOT NULL DEFAULT 'user',
          "isActive" boolean DEFAULT true
        );
      `);
    }

    //
    // 2. companies
    //
    const companiesExists = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'companies'
      ) AS "exists"
    `))[0].exists;

    if (!companiesExists) {
      await queryRunner.query(`
        CREATE TABLE "companies" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "tradeName" varchar NOT NULL,
          "legalName" varchar NOT NULL,
          "companyType" varchar NOT NULL,
          "taxId" varchar NOT NULL,
          "taxRegistry" varchar,
          "businessPurpose" varchar,
          "companyEmail" varchar,
          "companyPhone" varchar
        );
      `);
    }

    //
    // 3. Usuario temporal (sin duplicados)
    //
    await queryRunner.query(`
      INSERT INTO "user_entity"
        ("firstName","lastName","email","password","role","isActive")
      SELECT
        'Temp','User','temp@temp.com','temppassword','user',true
      WHERE NOT EXISTS (
        SELECT 1 FROM "user_entity" WHERE "email" = 'temp@temp.com'
      );
    `);

    //
    // 4. Actualizar compañías huérfanas
    //
    const tempUser = await queryRunner.query(`
      SELECT "id" FROM "user_entity"
      WHERE "email" = 'temp@temp.com' LIMIT 1
    `);
    const tempUserId = tempUser[0]?.id;
    if (tempUserId) {
      await queryRunner.query(`
        UPDATE "companies"
        SET "userId" = '${tempUserId}'
        WHERE "userId" IS NULL;
      `);
    }

    //
    // 5. FK companies → user_entity
    //
    const fkCompanies = await queryRunner.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'companies'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'FK_companies_userId'
    `);
    if (!fkCompanies.length) {
      await queryRunner.query(`
        ALTER TABLE "companies"
        ADD CONSTRAINT "FK_companies_userId"
        FOREIGN KEY ("userId") REFERENCES "user_entity"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }

    //
    // 6. income
    //
    const incomeExists = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'income'
      ) AS "exists"
    `))[0].exists;

    if (!incomeExists) {
      await queryRunner.query(`
        CREATE TABLE "income" (
          "id" SERIAL PRIMARY KEY,
          "amount" DECIMAL(12,2) NOT NULL,
          "category" VARCHAR NOT NULL,
          "invoiceNumber" VARCHAR,
          "createdAt" TIMESTAMP DEFAULT now(),
          "entryDate" TIMESTAMP DEFAULT now(),
          "dueDate" TIMESTAMP,
          "companyId" UUID
        );
      `);
    }

    const fkIncome = await queryRunner.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'income'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'FK_income_companyId'
    `);
    if (!fkIncome.length) {
      await queryRunner.query(`
        ALTER TABLE "income"
        ADD CONSTRAINT "FK_income_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }

    //
    // 7. expense
    //
    const expenseExists = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'expense'
      ) AS "exists"
    `))[0].exists;

    if (!expenseExists) {
      await queryRunner.query(`
        CREATE TABLE "expense" (
          "id" SERIAL PRIMARY KEY,
          "amount" DECIMAL(12,2) NOT NULL,
          "category" VARCHAR NOT NULL,
          "supplier" VARCHAR,
          "createdAt" TIMESTAMP DEFAULT now(),
          "entryDate" TIMESTAMP DEFAULT now(),
          "dueDate" TIMESTAMP,
          "companyId" UUID
        );
      `);
    }

    const fkExpense = await queryRunner.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'expense'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'FK_expense_companyId'
    `);
    if (!fkExpense.length) {
      await queryRunner.query(`
        ALTER TABLE "expense"
        ADD CONSTRAINT "FK_expense_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }

    //
    // 8. investment
    //
    const investmentExists = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'investment'
      ) AS "exists"
    `))[0].exists;

    if (!investmentExists) {
      await queryRunner.query(`
        CREATE TABLE "investment" (
          "id" SERIAL PRIMARY KEY,
          "amount" DECIMAL NOT NULL,
          "category" VARCHAR NOT NULL,
          "invoicenumber" VARCHAR,
          "createdAt" TIMESTAMP DEFAULT now(),
          "updatedAt" TIMESTAMP DEFAULT now(),
          "entryDate" TIMESTAMP DEFAULT now(),
          "exitDate" TIMESTAMP,
          "dueDate" TIMESTAMP,
          "companyId" UUID
        );
      `);
    }

    const fkInvestment = await queryRunner.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'investment'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'FK_investment_companyId'
    `);
    if (!fkInvestment.length) {
      await queryRunner.query(`
        ALTER TABLE "investment"
        ADD CONSTRAINT "FK_investment_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }

    //
    // 9. product
    //
    const productExists = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'product'
      ) AS "exists"
    `))[0].exists;

    if (!productExists) {
      await queryRunner.query(`
        CREATE TABLE "product" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR NOT NULL,
          "sku" VARCHAR UNIQUE NOT NULL,
          "description" VARCHAR,
          "category" VARCHAR,
          "imageUrl" VARCHAR,
          "price" DECIMAL(12,2) NOT NULL,
          "cost" DECIMAL(12,2) NOT NULL,
          "stock" INTEGER DEFAULT 0,
          "companyId" UUID
        );
      `);
    }

    const fkProduct = await queryRunner.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'product'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'FK_product_companyId'
    `);
    if (!fkProduct.length) {
      await queryRunner.query(`
        ALTER TABLE "product"
        ADD CONSTRAINT "FK_product_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminamos constraints y tablas con IF EXISTS para un rollback seguro
    await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "FK_product_companyId"`);
    await queryRunner.query(`ALTER TABLE "investment" DROP CONSTRAINT IF EXISTS "FK_investment_companyId"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "FK_expense_companyId"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT IF EXISTS "FK_income_companyId"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_companies_userId"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "product"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "investment"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "income"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_entity"`);
  }
}