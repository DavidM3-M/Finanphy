// src/migrations/1757795243469-AddMissingFieldsToProduct.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingFieldsToProduct1757795243469 implements MigrationInterface {
  name = 'AddMissingFieldsToProduct1757795243469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Verifica que la tabla exista
    if (!(await queryRunner.hasTable('product'))) {
      console.warn('[Migration] Tabla "product" no existe. Se omite la migración.');
      return;
    }

    // 2) Añade todas las columnas faltantes de golpe
    await queryRunner.query(`
      ALTER TABLE "product"
        ADD COLUMN IF NOT EXISTS "description" character varying,
        ADD COLUMN IF NOT EXISTS "category" character varying,
        ADD COLUMN IF NOT EXISTS "imageUrl" character varying,
        ADD COLUMN IF NOT EXISTS "price" numeric,
        ADD COLUMN IF NOT EXISTS "cost" numeric,
        ADD COLUMN IF NOT EXISTS "stock" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1) Verifica que la tabla exista
    if (!(await queryRunner.hasTable('product'))) {
      console.warn('[Migration] Tabla "product" no existe. No se puede revertir.');
      return;
    }

    // 2) Elimina las columnas en orden inverso
    await queryRunner.query(`
      ALTER TABLE "product"
        DROP COLUMN IF EXISTS "stock",
        DROP COLUMN IF EXISTS "cost",
        DROP COLUMN IF EXISTS "price",
        DROP COLUMN IF EXISTS "imageUrl",
        DROP COLUMN IF EXISTS "category",
        DROP COLUMN IF EXISTS "description"
    `);
  }
}