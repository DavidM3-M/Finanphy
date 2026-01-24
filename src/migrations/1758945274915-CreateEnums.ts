import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnums1758945274915 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_orders_status_enum') THEN
          CREATE TYPE client_orders_status_enum AS ENUM ('recibido', 'en_proceso', 'enviado');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'income_type_enum') THEN
          CREATE TYPE income_type_enum AS ENUM ('venta', 'servicio', 'otro');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_type_enum') THEN
          CREATE TYPE expense_type_enum AS ENUM ('fijo', 'variable', 'extraordinario');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'investment_type_enum') THEN
          CREATE TYPE investment_type_enum AS ENUM ('acciones', 'bonos', 'inmueble', 'startup');
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE IF EXISTS investment_type_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS expense_type_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS income_type_enum CASCADE`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS client_orders_status_enum CASCADE`,
    );
  }
}
