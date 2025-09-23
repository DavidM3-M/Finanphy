import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRelationToCompanies1757742295441 implements MigrationInterface {
  name = 'AddUserRelationToCompanies1757742295441';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Añadir columna solo si no existe
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'companies' AND column_name = 'userId'
        ) THEN
          ALTER TABLE "companies"
          ADD COLUMN "userId" uuid;
        END IF;
      END
      $$;
    `);

    // 2. Crear constraint solo si no existe
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'companies'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'userId'
        ) THEN
          ALTER TABLE "companies"
          ADD CONSTRAINT "FK_companies_userId"
          FOREIGN KEY ("userId") REFERENCES "user_entity"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar FK si existe
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'companies'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'userId'
        ) THEN
          ALTER TABLE "companies" DROP CONSTRAINT "FK_companies_userId";
        END IF;
      END
      $$;
    `);

    // 2. Eliminar columna si existe
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "userId";
    `);
  }
}