import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1757104635223 implements MigrationInterface {
    name = 'InitSchema1757104635223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear tabla user_entity (si no existe)
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

        // 2. Crear tabla companies (si no existe)
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

        // 3. Crear usuario temporal si no existe
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

        // 5. Asignar el userId temporal a los companies huérfanos (si existieran)
        await queryRunner.query(`
            UPDATE "companies" SET "userId" = '${tempUserId}' WHERE "userId" IS NULL
        `);

        // 6. Crear la clave foránea
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD CONSTRAINT "FK_companies_userId"
            FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_companies_userId"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "companies"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "user_entity"
        `);
    }
}
