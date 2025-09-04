import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToCompany1756967529774 implements MigrationInterface {
  name = 'AddUserIdToCompany1756967529774';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Asignar un userId temporal a registros huérfanos
    await queryRunner.query(`
      UPDATE "companies" SET "userId" = 1 WHERE "userId" IS NULL
    `);

    // 2. Eliminar la restricción anterior si existe
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_6d64e8c7527a9e4af83cc66cbf7"
    `);

    // 3. Hacer la columna obligatoria
    await queryRunner.query(`
      ALTER TABLE "companies" ALTER COLUMN "userId" SET NOT NULL
    `);

    // 4. Crear la nueva clave foránea
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"
      FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"
    `);

    await queryRunner.query(`
      ALTER TABLE "companies" ALTER COLUMN "userId" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"
      FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }
}