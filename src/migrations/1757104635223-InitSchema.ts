import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueSkuPerCompanyToProduct1757104635224 implements MigrationInterface {
  name = 'InitSchemaExtended1757104635223';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla user_entity
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_entity" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "firstName" varchar NOT NULL,
        "lastName" varchar NOT NULL,
        "email" varchar NOT NULL UNIQUE,
        "password" varchar NOT NULL,
        "role" varchar NOT NULL DEFAULT 'user',
        "isActive" boolean DEFAULT true
      )
    `);

    // 2. Crear tabla companies
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "companies" (
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
      )
    `);

    // 3. Crear usuario temporal
    await queryRunner.query(`
      INSERT INTO "user_entity" ("firstName", "lastName", "email", "password", "role", "isActive")
      SELECT 'Temp', 'User', 'temp@temp.com', 'temppassword', 'user', true
      WHERE NOT EXISTS (SELECT 1 FROM "user_entity" WHERE "email" = 'temp@temp.com')
    `);

    // 4. Obtener el id del usuario temporal
    const tempUser = await queryRunner.query(`
      SELECT "id" FROM "user_entity" WHERE "email" = 'temp@temp.com' LIMIT 1
    `);
    const tempUserId = tempUser[0]?.id;

    // 5. Asignar el userId temporal a companies huérfanos
    await queryRunner.query(`
      UPDATE "companies" SET "userId" = '${tempUserId}' WHERE "userId" IS NULL
    `);

    // 6. Clave foránea entre companies y user_entity
    const constraintExists = await queryRunner.query(`
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_companies_userId' AND table_name = 'companies'
    `);

    if (constraintExists.length === 0) {
    await queryRunner.query(`
        ALTER TABLE "companies"
        ADD CONSTRAINT "FK_companies_userId"
        FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    }

    // 7. Crear tabla income
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "income" (
        "id" SERIAL PRIMARY KEY,
        "amount" DECIMAL(12,2) NOT NULL,
        "category" VARCHAR NOT NULL,
        "invoiceNumber" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT now(),
        "entryDate" TIMESTAMP DEFAULT now(),
        "dueDate" TIMESTAMP,
        "companyId" UUID
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "income"
      ADD CONSTRAINT "FK_income_companyId"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // 8. Crear tabla expense
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expense" (
        "id" SERIAL PRIMARY KEY,
        "amount" DECIMAL(12,2) NOT NULL,
        "category" VARCHAR NOT NULL,
        "supplier" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT now(),
        "entryDate" TIMESTAMP DEFAULT now(),
        "dueDate" TIMESTAMP,
        "companyId" UUID
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "expense"
      ADD CONSTRAINT "FK_expense_companyId"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // 9. Crear tabla investment
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "investment" (
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
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "investment"
      ADD CONSTRAINT "FK_investment_companyId"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // 10. Crear tabla product
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product" (
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
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product"
      ADD CONSTRAINT "FK_product_companyId"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "FK_product_companyId"`);
    await queryRunner.query(`ALTER TABLE "investment" DROP CONSTRAINT IF EXISTS "FK_investment_companyId"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "FK_expense_companyId"`);
    await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT IF EXISTS "FK_income_companyId"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "product"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "investment"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "income"`);

    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_companies_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_entity"`);
  }
}