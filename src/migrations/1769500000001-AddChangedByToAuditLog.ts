import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Agrega changed_by a financial_audit_log y actualiza
 * las funciones de trigger para registrar el usuario que realizó
 * cada operación usando la variable de sesión app.current_user_id.
 *
 * Uso desde el backend (NestJS):
 *   await dataSource.query(`SET LOCAL app.current_user_id = '${userId}'`);
 *   // ... INSERT/UPDATE/DELETE sobre income, expense o investment
 *   // El trigger leerá app.current_user_id y lo guardará en changed_by
 */
export class AddChangedByToAuditLog1769500000001 implements MigrationInterface {
  name = 'AddChangedByToAuditLog1769500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna changed_by a financial_audit_log
    await queryRunner.query(`
      ALTER TABLE financial_audit_log
        ADD COLUMN IF NOT EXISTS changed_by UUID DEFAULT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by
        ON financial_audit_log (changed_by)
    `);

    // 2. Actualizar fn_audit_income para leer app.current_user_id
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_audit_income()
      RETURNS TRIGGER AS $$
      DECLARE
        v_user_id UUID;
      BEGIN
        BEGIN
          v_user_id := current_setting('app.current_user_id', true)::UUID;
        EXCEPTION WHEN others THEN
          v_user_id := NULL;
        END;

        IF TG_OP = 'INSERT' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, new_data, changed_by)
          VALUES ('income', NEW.id::TEXT, 'INSERT', row_to_json(NEW)::jsonb, v_user_id);
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, new_data, changed_by)
          VALUES ('income', NEW.id::TEXT, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_user_id);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, changed_by)
          VALUES ('income', OLD.id::TEXT, 'DELETE', row_to_json(OLD)::jsonb, v_user_id);
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. Actualizar fn_audit_expense
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_audit_expense()
      RETURNS TRIGGER AS $$
      DECLARE
        v_user_id UUID;
      BEGIN
        BEGIN
          v_user_id := current_setting('app.current_user_id', true)::UUID;
        EXCEPTION WHEN others THEN
          v_user_id := NULL;
        END;

        IF TG_OP = 'INSERT' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, new_data, changed_by)
          VALUES ('expense', NEW.id::TEXT, 'INSERT', row_to_json(NEW)::jsonb, v_user_id);
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, new_data, changed_by)
          VALUES ('expense', NEW.id::TEXT, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_user_id);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, changed_by)
          VALUES ('expense', OLD.id::TEXT, 'DELETE', row_to_json(OLD)::jsonb, v_user_id);
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 4. Actualizar fn_audit_investment
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_audit_investment()
      RETURNS TRIGGER AS $$
      DECLARE
        v_user_id UUID;
      BEGIN
        BEGIN
          v_user_id := current_setting('app.current_user_id', true)::UUID;
        EXCEPTION WHEN others THEN
          v_user_id := NULL;
        END;

        IF TG_OP = 'INSERT' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, new_data, changed_by)
          VALUES ('investment', NEW.id::TEXT, 'INSERT', row_to_json(NEW)::jsonb, v_user_id);
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, new_data, changed_by)
          VALUES ('investment', NEW.id::TEXT, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_user_id);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, changed_by)
          VALUES ('investment', OLD.id::TEXT, 'DELETE', row_to_json(OLD)::jsonb, v_user_id);
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir fn_audit_income a versión sin changed_by
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_audit_income()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, new_data)
          VALUES ('income', NEW.id::TEXT, 'INSERT', row_to_json(NEW)::jsonb);
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, new_data)
          VALUES ('income', NEW.id::TEXT, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data)
          VALUES ('income', OLD.id::TEXT, 'DELETE', row_to_json(OLD)::jsonb);
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_audit_expense()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, new_data)
          VALUES ('expense', NEW.id::TEXT, 'INSERT', row_to_json(NEW)::jsonb);
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, new_data)
          VALUES ('expense', NEW.id::TEXT, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data)
          VALUES ('expense', OLD.id::TEXT, 'DELETE', row_to_json(OLD)::jsonb);
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_audit_investment()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, new_data)
          VALUES ('investment', NEW.id::TEXT, 'INSERT', row_to_json(NEW)::jsonb);
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data, new_data)
          VALUES ('investment', NEW.id::TEXT, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO financial_audit_log (table_name, record_id, action, old_data)
          VALUES ('investment', OLD.id::TEXT, 'DELETE', row_to_json(OLD)::jsonb);
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_log_changed_by`);

    await queryRunner.query(`
      ALTER TABLE financial_audit_log DROP COLUMN IF EXISTS changed_by
    `);
  }
}
