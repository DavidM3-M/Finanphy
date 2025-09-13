import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserEntityTable1757742041862 implements MigrationInterface {
  name = 'CreateUserEntityTable1757742041862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Habilitar extensión uuid-ossp
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // 2. Crear el ENUM o añadir valores faltantes
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Crear tipo si no existe
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'user_entity_role_enum'
        ) THEN
          CREATE TYPE "user_entity_role_enum" AS ENUM('Admin','User');
        END IF;

        -- Asegurar que 'Admin' está en el ENUM
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'user_entity_role_enum'
            AND e.enumlabel = 'Admin'
        ) THEN
          ALTER TYPE "user_entity_role_enum" ADD VALUE 'Admin';
        END IF;

        -- Asegurar que 'User' está en el ENUM
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'user_entity_role_enum'
            AND e.enumlabel = 'User'
        ) THEN
          ALTER TYPE "user_entity_role_enum" ADD VALUE 'User';
        END IF;
      END
      $$;
    `);

    // 3. Crear la tabla solo si no existe
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
    // 1. Eliminar la tabla si existe
    await queryRunner.query(`
      DROP TABLE IF EXISTS "user_entity";
    `);

    // 2. Eliminar el ENUM si existe
    await queryRunner.query(`
      DROP TYPE IF EXISTS "user_entity_role_enum";
    `);
  }
}