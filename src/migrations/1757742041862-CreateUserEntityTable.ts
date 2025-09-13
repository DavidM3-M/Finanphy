import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserEntityTable1757742041862 implements MigrationInterface {
  name = 'CreateUserEntityTable1757742041862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Habilitar extensión de UUID si no existe
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // 2. Crear tipo ENUM solo si no existe
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'user_entity_role_enum'
        ) THEN
          CREATE TYPE "user_entity_role_enum" AS ENUM('Admin','User');
        END IF;
      END
      $$;
    `);

    // 3. Crear tabla solo si no existe
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_entity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" varchar NOT NULL,
        "lastName" varchar NOT NULL,
        "email" varchar NOT NULL,
        "password" varchar NOT NULL,
        "role" "user_entity_role_enum" NOT NULL DEFAULT 'User',
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_user_entity_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_entity_email" UNIQUE ("email")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla y tipo si existen
    await queryRunner.query(`
      DROP TABLE IF EXISTS "user_entity";
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "user_entity_role_enum";
    `);
  }
}