import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorCompaniesIdToUuid1758945274914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- 1. Agregar extensión uuid-ossp si no existe
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- 2. Crear nueva columna temporal con UUID
      ALTER TABLE "companies"
      ADD COLUMN "temp_id" UUID DEFAULT uuid_generate_v4();

      -- 3. Copiar datos del id actual si necesitas trazabilidad (opcional)
      -- UPDATE "companies" SET "temp_id" = uuid_generate_v4();

      -- 4. Eliminar constraints que dependan de "id" si existen (ajusta según tu esquema)
      -- ALTER TABLE "client_orders" DROP CONSTRAINT IF EXISTS "FK_client_orders_companyId";

      -- 5. Eliminar columna original y renombrar
      ALTER TABLE "companies" DROP COLUMN "id";
      ALTER TABLE "companies" RENAME COLUMN "temp_id" TO "id";

      -- 6. Establecer como PRIMARY KEY
      ALTER TABLE "companies" ADD PRIMARY KEY ("id");

      -- 7. Reestablecer relaciones si eliminaste constraints
      -- ALTER TABLE "client_orders"
      -- ADD CONSTRAINT "FK_client_orders_companyId"
      -- FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
    `);
  }

  public async down(): Promise<void> {
    throw new Error('Manual rollback required for RefactorCompaniesIdToUuid');
  }
}