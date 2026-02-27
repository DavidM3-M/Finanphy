import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSinEnviarToClientOrdersStatus1769229999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum value if it doesn't exist
    await queryRunner.query(`DO $$\nBEGIN\n    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'client_orders_status_enum' AND e.enumlabel = 'sin_enviar') THEN\n        ALTER TYPE client_orders_status_enum ADD VALUE 'sin_enviar';\n    END IF;\nEND$$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Down migration: cannot safely remove enum value in Postgres; leave as no-op
    // As a best-effort, reset default to 'recibido' if it exists
    try {
      await queryRunner.query(`ALTER TABLE client_orders ALTER COLUMN status SET DEFAULT 'recibido'`);
    } catch (err) {
      // ignore
    }
  }
}
