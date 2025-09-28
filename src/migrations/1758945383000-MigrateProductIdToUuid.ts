import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateProductIdToUuid1758945300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Paso 1: agregar columna temporal
      ALTER TABLE product ADD COLUMN id_uuid uuid DEFAULT uuid_generate_v4();

      -- Paso 2: migrar datos si es necesario (omitir si no hay datos)

      -- Paso 3: eliminar columna antigua y renombrar
      ALTER TABLE product DROP COLUMN IF EXISTS id;
      ALTER TABLE product RENAME COLUMN id_uuid TO id;

      -- Paso 4: agregar PRIMARY KEY
      ALTER TABLE product ADD PRIMARY KEY (id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Paso 1: eliminar clave primaria actual
      ALTER TABLE product DROP CONSTRAINT IF EXISTS product_pkey;

      -- Paso 2: agregar columna integer temporal
      ALTER TABLE product ADD COLUMN id_old integer;

      -- Paso 3: eliminar columna uuid y restaurar integer
      ALTER TABLE product DROP COLUMN id;
      ALTER TABLE product RENAME COLUMN id_old TO id;

      -- Paso 4: restaurar clave primaria
      ALTER TABLE product ADD PRIMARY KEY (id);
    `);
  }
}