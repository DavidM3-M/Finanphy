import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceClientOrdersStatusEnum1769230000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create new enum type with desired values
    await queryRunner.query(`CREATE TYPE client_orders_status_enum_new AS ENUM ('sin_enviar', 'enviado')`);

    // Map existing values 'recibido' and 'en_proceso' to 'sin_enviar'
    await queryRunner.query(`UPDATE client_orders SET status = 'sin_enviar' WHERE status IN ('recibido','en_proceso')`);

    // Drop default first to avoid cast errors, then alter column to use new enum type
    await queryRunner.query(`ALTER TABLE client_orders ALTER COLUMN status DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE client_orders ALTER COLUMN status TYPE client_orders_status_enum_new USING status::text::client_orders_status_enum_new`);

    // Drop old type and rename new one
    await queryRunner.query(`DROP TYPE client_orders_status_enum`);
    await queryRunner.query(`ALTER TYPE client_orders_status_enum_new RENAME TO client_orders_status_enum`);

    // Set default to new value
    await queryRunner.query(`ALTER TABLE client_orders ALTER COLUMN status SET DEFAULT 'sin_enviar'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate old enum
    await queryRunner.query(`CREATE TYPE client_orders_status_enum_old AS ENUM ('recibido','en_proceso','enviado')`);

    // Map current values back: 'sin_enviar' -> 'recibido'
    await queryRunner.query(`UPDATE client_orders SET status = 'recibido' WHERE status = 'sin_enviar'`);

    // Alter column to old enum
    await queryRunner.query(`ALTER TABLE client_orders ALTER COLUMN status TYPE client_orders_status_enum_old USING status::text::client_orders_status_enum_old`);

    // Drop current and rename old back
    await queryRunner.query(`DROP TYPE client_orders_status_enum`);
    await queryRunner.query(`ALTER TYPE client_orders_status_enum_old RENAME TO client_orders_status_enum`);

    // Restore default
    await queryRunner.query(`ALTER TABLE client_orders ALTER COLUMN status SET DEFAULT 'recibido'`);
  }
}
