import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToCompany1756967529774 implements MigrationInterface {
  name = 'AddUserIdToCompany1756967529774';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear usuario dummy si no existe
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

    // 2. Asignar ese userId a compañías huérfanas
    await queryRunner.query(`
      UPDATE "companies" SET "userId" = '00000000-0000-0000-0000-000000000001'
      WHERE "userId" IS NULL;
    `);

    // 3. Eliminar constraint anterior si existe
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_companies_userId";
    `);

    // 4. Alterar columna a NOT NULL
    await queryRunner.query(`
      ALTER TABLE "companies" ALTER COLUMN "userId" SET NOT NULL;
    `);

    // 5. Crear nueva constraint explícita
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_companies_userId"
      FOREIGN KEY ("userId") REFERENCES "user_entity"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT "FK_companies_userId";
    `);

    await queryRunner.query(`
      ALTER TABLE "companies" ALTER COLUMN "userId" DROP NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_companies_userId"
      FOREIGN KEY ("userId") REFERENCES "user_entity"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);
  }
}