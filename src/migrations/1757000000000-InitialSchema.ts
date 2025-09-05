import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1757000000000 implements MigrationInterface {
  name = 'InitialSchema1757000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Habilitar extensión para UUIDs
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2. Eliminar constraint existente en companies
    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"`);

    // 3. Reemplazar id en user_entity por UUID
    await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "PK_b54f8ea623b17094db7667d8206"`);
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "user_entity" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "PK_b54f8ea623b17094db7667d8206" PRIMARY KEY ("id")`);

    // 4. Insertar usuario dummy
    await queryRunner.query(`
      INSERT INTO "user_entity" ("id", "email", "password", "firstName", "lastName")
      SELECT
        '00000000-0000-0000-0000-000000000001',
        'placeholder@system.local',
        'hashed',
        'System',
        'Placeholder'
      WHERE NOT EXISTS (
        SELECT 1 FROM "user_entity" WHERE "id" = '00000000-0000-0000-0000-000000000001'
      );
    `);

    // 5. Eliminar columna userId en companies
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "userId"`);

    // 6. Agregar columna userId como UUID (nullable)
    await queryRunner.query(`ALTER TABLE "companies" ADD "userId" uuid`);

    // 7. Asignar el usuario dummy a compañías huérfanas
    await queryRunner.query(`
      UPDATE "companies" SET "userId" = '00000000-0000-0000-0000-000000000001'
      WHERE "userId" IS NULL;
    `);

    // 8. Convertir columna a NOT NULL
    await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "userId" SET NOT NULL`);

    // 9. Agregar nueva foreign key
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"
      FOREIGN KEY ("userId") REFERENCES "user_entity"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir la foreign key
    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"`);

    // Revertir columna userId
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "companies" ADD "userId" integer NOT NULL`);

    // Revertir columna id en user_entity
    await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "PK_b54f8ea623b17094db7667d8206"`);
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "user_entity" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "PK_b54f8ea623b17094db7667d8206" PRIMARY KEY ("id")`);

    // Restaurar foreign key original
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"
      FOREIGN KEY ("userId") REFERENCES "user_entity"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
  }
}