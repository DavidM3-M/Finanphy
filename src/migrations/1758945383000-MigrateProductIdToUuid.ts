import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateProductIdToUuid1758945300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasProductTable = await queryRunner.hasTable('product');
    if (!hasProductTable) {
      return;
    }
    await queryRunner.query(`
      -- Paso 1: agregar columna temporal
      ALTER TABLE IF EXISTS product ADD COLUMN id_uuid uuid DEFAULT uuid_generate_v4();

      -- Paso 2: migrar datos si es necesario (omitir si no hay datos)

      -- Paso 3: eliminar columna antigua y renombrar
      ALTER TABLE IF EXISTS product DROP COLUMN IF EXISTS id;
      ALTER TABLE IF EXISTS product RENAME COLUMN id_uuid TO id;

      -- Paso 4: agregar PRIMARY KEY
      ALTER TABLE IF EXISTS product ADD PRIMARY KEY (id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasProductTable = await queryRunner.hasTable('product');
    if (!hasProductTable) {
      return;
    }
    await queryRunner.query(`
      -- Paso 1: eliminar clave primaria actual
      ALTER TABLE IF EXISTS product DROP CONSTRAINT IF EXISTS product_pkey;

      -- Paso 2: agregar columna integer temporal
      ALTER TABLE IF EXISTS product ADD COLUMN id_old integer;

      -- Paso 3: eliminar columna uuid y restaurar integer
      ALTER TABLE IF EXISTS product DROP COLUMN id;
      ALTER TABLE IF EXISTS product RENAME COLUMN id_old TO id;

      -- Paso 4: restaurar clave primaria
      ALTER TABLE IF EXISTS product ADD PRIMARY KEY (id);
    `);
  }
}
