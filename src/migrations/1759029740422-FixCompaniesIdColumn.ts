import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCompaniesIdColumn1759029740422 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Paso 1: Eliminar constraints y columna actual
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_pkey";
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "id";
    `);

    // Paso 2: Crear columna sin DEFAULT
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "id" UUID NOT NULL;
    `);

    // Paso 3: Restaurar PK
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD PRIMARY KEY ("id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: eliminar columna y restaurar con DEFAULT si lo tuvieras antes
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_pkey";
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "id";
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "id" UUID PRIMARY KEY DEFAULT gen_random_uuid();
    `);
  }
}