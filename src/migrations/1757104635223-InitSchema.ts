import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1757104635223 implements MigrationInterface {
    name = 'InitSchema1757104635223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Agrega la columna userId solo si no existe
        const table = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name='companies' AND column_name='userId'
        `);
        if (table.length === 0) {
            await queryRunner.query(`ALTER TABLE "companies" ADD "userId" integer`);
        }

        // 2. Crea un usuario temporal si no existe
        await queryRunner.query(`
            INSERT INTO "user_entity" ("firstName", "lastName", "email", "password", "role", "isActive")
            SELECT 'Temp', 'User', 'temp@temp.com', 'temppassword', 'user', true
            WHERE NOT EXISTS (SELECT 1 FROM "user_entity" WHERE "email" = 'temp@temp.com')
        `);

        // 3. Obtiene el id del usuario temporal
        const tempUser = await queryRunner.query(`
            SELECT "id" FROM "user_entity" WHERE "email" = 'temp@temp.com' LIMIT 1
        `);
        const tempUserId = tempUser[0]?.id;

        // 4. Asigna el userId temporal a los companies huérfanos
        await queryRunner.query(`
            UPDATE "companies" SET "userId" = '${tempUserId}' WHERE "userId" IS NULL
        `);

        // 5. Vuelve la columna obligatoria
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "userId" SET NOT NULL`);

        // 6. Elimina la restricción anterior si existe
        await queryRunner.query(`
            ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_6d64e8c7527a9e4af83cc66cbf7"
        `);

        // 7. Crea la clave foránea
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"
            FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_6d64e8c7527a9e4af83cc66cbf7"
        `);
        await queryRunner.query(`
            ALTER TABLE "companies" ALTER COLUMN "userId" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "companies" DROP COLUMN IF EXISTS "userId"
        `);
        // No borres el usuario temporal para evitar problemas de integridad
    }
}
