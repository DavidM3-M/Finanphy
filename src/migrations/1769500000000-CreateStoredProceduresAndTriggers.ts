import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Stored Procedures + Triggers
 *
 * Triggers creados:
 *  - trg_customers_set_updated_at   → BEFORE UPDATE en customers
 *  - trg_suppliers_set_updated_at   → BEFORE UPDATE en suppliers
 *  - trg_investment_set_updated_at  → BEFORE UPDATE en investment
 *  - trg_income_audit               → AFTER INSERT/UPDATE/DELETE en income
 *  - trg_expense_audit              → AFTER INSERT/UPDATE/DELETE en expense
 *  - trg_investment_audit           → AFTER INSERT/UPDATE/DELETE en investment
 *  - trg_low_stock_alert            → AFTER UPDATE en product (stock < umbral)
 *
 * Procedimientos almacenados (funciones PL/pgSQL):
 *  - sp_create_income / sp_update_income / sp_delete_income
 *  - sp_create_expense / sp_update_expense / sp_delete_expense
 *  - sp_create_investment / sp_update_investment / sp_delete_investment
 *  - sp_create_customer / sp_update_customer / sp_delete_customer
 *  - sp_register_customer_payment
 *  - sp_reserve_product_stock / sp_restore_product_stock
 *  - sp_create_product / sp_update_product / sp_delete_product
 */
export class CreateStoredProceduresAndTriggers1769500000000
  implements MigrationInterface
{
  name = 'CreateStoredProceduresAndTriggers1769500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Tabla de auditoría financiera
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financial_audit_log (
        id          BIGSERIAL    PRIMARY KEY,
        table_name  VARCHAR(50)  NOT NULL,
        record_id   VARCHAR(40)  NOT NULL,
        action      VARCHAR(10)  NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
        old_data    JSONB,
        new_data    JSONB,
        changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_table_record
        ON financial_audit_log (table_name, record_id)
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Tabla de alertas de stock bajo
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stock_alerts (
        id          BIGSERIAL    PRIMARY KEY,
        "productId" UUID         NOT NULL,
        stock       INT          NOT NULL,
        threshold   INT          NOT NULL,
        alerted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // TRIGGER FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────

    // 3. fn_set_updated_at: auto-actualiza "updatedAt" en cualquier tabla
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 4. Triggers updatedAt → customers, suppliers, investment
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_customers_set_updated_at ON customers;
      CREATE TRIGGER trg_customers_set_updated_at
        BEFORE UPDATE ON customers
        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_suppliers_set_updated_at ON suppliers;
      CREATE TRIGGER trg_suppliers_set_updated_at
        BEFORE UPDATE ON suppliers
        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_investment_set_updated_at ON investment;
      CREATE TRIGGER trg_investment_set_updated_at
        BEFORE UPDATE ON investment
        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    `);

    // 5. fn_audit_income
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
      DROP TRIGGER IF EXISTS trg_income_audit ON income;
      CREATE TRIGGER trg_income_audit
        AFTER INSERT OR UPDATE OR DELETE ON income
        FOR EACH ROW EXECUTE FUNCTION fn_audit_income();
    `);

    // 6. fn_audit_expense
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
      DROP TRIGGER IF EXISTS trg_expense_audit ON expense;
      CREATE TRIGGER trg_expense_audit
        AFTER INSERT OR UPDATE OR DELETE ON expense
        FOR EACH ROW EXECUTE FUNCTION fn_audit_expense();
    `);

    // 7. fn_audit_investment
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

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_investment_audit ON investment;
      CREATE TRIGGER trg_investment_audit
        AFTER INSERT OR UPDATE OR DELETE ON investment
        FOR EACH ROW EXECUTE FUNCTION fn_audit_investment();
    `);

    // 8. fn_low_stock_alert: registra alerta cuando el stock cae por debajo de 5
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_low_stock_alert()
      RETURNS TRIGGER AS $$
      DECLARE
        v_threshold INT := 5;
      BEGIN
        IF NEW.stock < v_threshold AND OLD.stock >= v_threshold THEN
          INSERT INTO stock_alerts ("productId", stock, threshold)
          VALUES (NEW.id, NEW.stock, v_threshold);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_low_stock_alert ON product;
      CREATE TRIGGER trg_low_stock_alert
        AFTER UPDATE OF stock ON product
        FOR EACH ROW EXECUTE FUNCTION fn_low_stock_alert();
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // STORED PROCEDURES — INCOME
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_create_income(
        p_amount         NUMERIC(12,2),
        p_category       VARCHAR,
        p_company_id     UUID,
        p_description    VARCHAR     DEFAULT NULL,
        p_invoice_number VARCHAR     DEFAULT NULL,
        p_entry_date     TIMESTAMPTZ DEFAULT NULL,
        p_due_date       TIMESTAMPTZ DEFAULT NULL,
        p_order_id       UUID        DEFAULT NULL,
        p_customer_id    UUID        DEFAULT NULL
      )
      RETURNS income AS $$
      DECLARE
        v_row income;
      BEGIN
        IF p_amount <= 0 THEN
          RAISE EXCEPTION 'El monto del ingreso debe ser mayor a cero';
        END IF;

        INSERT INTO income (
          amount, category, description, "invoiceNumber",
          "entryDate", "dueDate", "companyId", "orderId", "customerId"
        )
        VALUES (
          p_amount, p_category, p_description, p_invoice_number,
          COALESCE(p_entry_date, NOW()), p_due_date, p_company_id, p_order_id, p_customer_id
        )
        RETURNING * INTO v_row;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_update_income(
        p_id             INT,
        p_amount         NUMERIC(12,2) DEFAULT NULL,
        p_category       VARCHAR       DEFAULT NULL,
        p_description    VARCHAR       DEFAULT NULL,
        p_invoice_number VARCHAR       DEFAULT NULL,
        p_entry_date     TIMESTAMPTZ   DEFAULT NULL,
        p_due_date       TIMESTAMPTZ   DEFAULT NULL
      )
      RETURNS income AS $$
      DECLARE
        v_row income;
      BEGIN
        IF p_amount IS NOT NULL AND p_amount <= 0 THEN
          RAISE EXCEPTION 'El monto del ingreso debe ser mayor a cero';
        END IF;

        UPDATE income
        SET
          amount          = COALESCE(p_amount, amount),
          category        = COALESCE(p_category, category),
          description     = COALESCE(p_description, description),
          "invoiceNumber" = COALESCE(p_invoice_number, "invoiceNumber"),
          "entryDate"     = COALESCE(p_entry_date, "entryDate"),
          "dueDate"       = COALESCE(p_due_date, "dueDate")
        WHERE id = p_id
        RETURNING * INTO v_row;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Ingreso con ID % no encontrado', p_id;
        END IF;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_delete_income(p_id INT)
      RETURNS VOID AS $$
      BEGIN
        DELETE FROM income WHERE id = p_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Ingreso con ID % no encontrado', p_id;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // STORED PROCEDURES — EXPENSE
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_create_expense(
        p_amount      NUMERIC(12,2),
        p_category    VARCHAR,
        p_company_id  UUID,
        p_description VARCHAR   DEFAULT NULL,
        p_supplier    VARCHAR   DEFAULT NULL,
        p_entry_date  TIMESTAMP DEFAULT NULL,
        p_due_date    TIMESTAMP DEFAULT NULL
      )
      RETURNS expense AS $$
      DECLARE
        v_row expense;
      BEGIN
        IF p_amount <= 0 THEN
          RAISE EXCEPTION 'El monto del gasto debe ser mayor a cero';
        END IF;

        INSERT INTO expense (
          amount, category, description, supplier,
          "entryDate", "dueDate", "companyId"
        )
        VALUES (
          p_amount, p_category, p_description, p_supplier,
          COALESCE(p_entry_date, NOW()), p_due_date, p_company_id
        )
        RETURNING * INTO v_row;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_update_expense(
        p_id          INT,
        p_amount      NUMERIC(12,2) DEFAULT NULL,
        p_category    VARCHAR       DEFAULT NULL,
        p_description VARCHAR       DEFAULT NULL,
        p_supplier    VARCHAR       DEFAULT NULL,
        p_entry_date  TIMESTAMP     DEFAULT NULL,
        p_due_date    TIMESTAMP     DEFAULT NULL
      )
      RETURNS expense AS $$
      DECLARE
        v_row expense;
      BEGIN
        IF p_amount IS NOT NULL AND p_amount <= 0 THEN
          RAISE EXCEPTION 'El monto del gasto debe ser mayor a cero';
        END IF;

        UPDATE expense
        SET
          amount      = COALESCE(p_amount, amount),
          category    = COALESCE(p_category, category),
          description = COALESCE(p_description, description),
          supplier    = COALESCE(p_supplier, supplier),
          "entryDate" = COALESCE(p_entry_date, "entryDate"),
          "dueDate"   = COALESCE(p_due_date, "dueDate")
        WHERE id = p_id
        RETURNING * INTO v_row;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Gasto con ID % no encontrado', p_id;
        END IF;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_delete_expense(p_id INT)
      RETURNS VOID AS $$
      BEGIN
        DELETE FROM expense WHERE id = p_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Gasto con ID % no encontrado', p_id;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // STORED PROCEDURES — INVESTMENT
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_create_investment(
        p_amount         NUMERIC(12,2),
        p_category       VARCHAR,
        p_company_id     UUID,
        p_invoice_number VARCHAR   DEFAULT NULL,
        p_entry_date     TIMESTAMP DEFAULT NULL,
        p_exit_date      TIMESTAMP DEFAULT NULL,
        p_due_date       TIMESTAMP DEFAULT NULL
      )
      RETURNS investment AS $$
      DECLARE
        v_row investment;
      BEGIN
        IF p_amount <= 0 THEN
          RAISE EXCEPTION 'El monto de la inversión debe ser mayor a cero';
        END IF;

        INSERT INTO investment (
          amount, category, "invoicenumber",
          "entryDate", "exitDate", "dueDate", "companyId"
        )
        VALUES (
          p_amount, p_category, p_invoice_number,
          COALESCE(p_entry_date, NOW()), p_exit_date, p_due_date, p_company_id
        )
        RETURNING * INTO v_row;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_update_investment(
        p_id             INT,
        p_amount         NUMERIC(12,2) DEFAULT NULL,
        p_category       VARCHAR       DEFAULT NULL,
        p_invoice_number VARCHAR       DEFAULT NULL,
        p_entry_date     TIMESTAMP     DEFAULT NULL,
        p_exit_date      TIMESTAMP     DEFAULT NULL,
        p_due_date       TIMESTAMP     DEFAULT NULL
      )
      RETURNS investment AS $$
      DECLARE
        v_row investment;
      BEGIN
        IF p_amount IS NOT NULL AND p_amount <= 0 THEN
          RAISE EXCEPTION 'El monto de la inversión debe ser mayor a cero';
        END IF;

        UPDATE investment
        SET
          amount          = COALESCE(p_amount, amount),
          category        = COALESCE(p_category, category),
          "invoicenumber" = COALESCE(p_invoice_number, "invoicenumber"),
          "entryDate"     = COALESCE(p_entry_date, "entryDate"),
          "exitDate"      = COALESCE(p_exit_date, "exitDate"),
          "dueDate"       = COALESCE(p_due_date, "dueDate"),
          "updatedAt"     = NOW()
        WHERE id = p_id
        RETURNING * INTO v_row;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Inversión con ID % no encontrada', p_id;
        END IF;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_delete_investment(p_id INT)
      RETURNS VOID AS $$
      BEGIN
        DELETE FROM investment WHERE id = p_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Inversión con ID % no encontrada', p_id;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // STORED PROCEDURES — CUSTOMER
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_create_customer(
        p_name        VARCHAR,
        p_company_id  UUID,
        p_email       VARCHAR       DEFAULT NULL,
        p_phone       VARCHAR       DEFAULT NULL,
        p_document_id VARCHAR       DEFAULT NULL,
        p_address     VARCHAR       DEFAULT NULL,
        p_notes       TEXT          DEFAULT NULL,
        p_debt        NUMERIC(12,2) DEFAULT 0,
        p_credit      NUMERIC(12,2) DEFAULT 0
      )
      RETURNS customers AS $$
      DECLARE
        v_row customers;
      BEGIN
        IF p_debt < 0 OR p_credit < 0 THEN
          RAISE EXCEPTION 'debt y credit deben ser >= 0';
        END IF;

        INSERT INTO customers (
          name, "companyId", email, phone, "documentId", address, notes, debt, credit
        )
        VALUES (
          p_name, p_company_id, p_email, p_phone, p_document_id, p_address, p_notes, p_debt, p_credit
        )
        RETURNING * INTO v_row;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_update_customer(
        p_id          UUID,
        p_name        VARCHAR DEFAULT NULL,
        p_email       VARCHAR DEFAULT NULL,
        p_phone       VARCHAR DEFAULT NULL,
        p_document_id VARCHAR DEFAULT NULL,
        p_address     VARCHAR DEFAULT NULL,
        p_notes       TEXT    DEFAULT NULL
      )
      RETURNS customers AS $$
      DECLARE
        v_row customers;
      BEGIN
        UPDATE customers
        SET
          name          = COALESCE(p_name, name),
          email         = COALESCE(p_email, email),
          phone         = COALESCE(p_phone, phone),
          "documentId"  = COALESCE(p_document_id, "documentId"),
          address       = COALESCE(p_address, address),
          notes         = COALESCE(p_notes, notes),
          "updatedAt"   = NOW()
        WHERE id = p_id
        RETURNING * INTO v_row;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Cliente con ID % no encontrado', p_id;
        END IF;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_delete_customer(p_id UUID)
      RETURNS VOID AS $$
      BEGIN
        DELETE FROM customers WHERE id = p_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Cliente con ID % no encontrado', p_id;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // STORED PROCEDURE — CUSTOMER PAYMENT (con lógica de saldo)
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_register_customer_payment(
        p_customer_id    UUID,
        p_amount         NUMERIC(12,2),
        p_paid_at        TIMESTAMPTZ  DEFAULT NOW(),
        p_payment_method VARCHAR      DEFAULT NULL,
        p_note           TEXT         DEFAULT NULL,
        p_order_id       UUID         DEFAULT NULL
      )
      RETURNS customer_payments AS $$
      DECLARE
        v_current_debt   NUMERIC(12,2);
        v_current_credit NUMERIC(12,2);
        v_remaining      NUMERIC(12,2);
        v_new_debt       NUMERIC(12,2);
        v_new_credit     NUMERIC(12,2);
        v_balance_after  NUMERIC(12,2);
        v_row            customer_payments;
      BEGIN
        IF p_amount <= 0 THEN
          RAISE EXCEPTION 'El monto del pago debe ser mayor a cero';
        END IF;

        SELECT debt, credit
          INTO v_current_debt, v_current_credit
          FROM customers
         WHERE id = p_customer_id
           FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Cliente con ID % no encontrado', p_customer_id;
        END IF;

        -- Aplicar el pago primero a la deuda existente
        v_remaining := p_amount - v_current_debt;

        IF v_remaining > 0 THEN
          -- El pago cubre toda la deuda y genera crédito
          v_new_debt   := 0;
          v_new_credit := v_current_credit + v_remaining;
        ELSE
          -- El pago reduce parcialmente la deuda
          v_new_debt   := v_current_debt - p_amount;
          v_new_credit := v_current_credit;
        END IF;

        v_balance_after := v_new_debt;

        UPDATE customers
           SET debt       = v_new_debt,
               credit     = v_new_credit,
               "updatedAt" = NOW()
         WHERE id = p_customer_id;

        INSERT INTO customer_payments (
          "customerId", amount, "paidAt", "paymentMethod",
          note, "orderId", "balanceAfter"
        )
        VALUES (
          p_customer_id, p_amount, COALESCE(p_paid_at, NOW()), p_payment_method,
          p_note, p_order_id, v_balance_after
        )
        RETURNING * INTO v_row;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // STORED PROCEDURES — PRODUCT STOCK
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_reserve_product_stock(
        p_product_id UUID,
        p_quantity   INT
      )
      RETURNS VOID AS $$
      DECLARE
        v_stock INT;
      BEGIN
        IF p_quantity <= 0 THEN
          RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
        END IF;

        SELECT stock INTO v_stock
          FROM product
         WHERE id = p_product_id
           FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Producto no encontrado: %', p_product_id;
        END IF;

        IF v_stock < p_quantity THEN
          RAISE EXCEPTION 'Stock insuficiente para el producto %. Disponible: %, Solicitado: %',
            p_product_id, v_stock, p_quantity;
        END IF;

        UPDATE product SET stock = stock - p_quantity WHERE id = p_product_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_restore_product_stock(
        p_product_id UUID,
        p_quantity   INT
      )
      RETURNS VOID AS $$
      BEGIN
        IF p_quantity <= 0 THEN
          RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
        END IF;

        UPDATE product SET stock = stock + p_quantity WHERE id = p_product_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Producto no encontrado: %', p_product_id;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // STORED PROCEDURES — PRODUCT CRUD
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_create_product(
        p_name        VARCHAR,
        p_sku         VARCHAR,
        p_price       NUMERIC(12,2),
        p_cost        NUMERIC(12,2),
        p_company_id  UUID,
        p_description VARCHAR       DEFAULT NULL,
        p_category    VARCHAR       DEFAULT NULL,
        p_stock       INT           DEFAULT 0,
        p_is_public   BOOLEAN       DEFAULT TRUE,
        p_is_active   BOOLEAN       DEFAULT TRUE,
        p_entry_date  TIMESTAMPTZ   DEFAULT NULL,
        p_expires_at  TIMESTAMPTZ   DEFAULT NULL
      )
      RETURNS product AS $$
      DECLARE
        v_row product;
      BEGIN
        IF p_price < 0 OR p_cost < 0 THEN
          RAISE EXCEPTION 'price y cost deben ser >= 0';
        END IF;
        IF p_stock < 0 THEN
          RAISE EXCEPTION 'stock debe ser >= 0';
        END IF;

        INSERT INTO product (
          name, sku, price, cost, description, category,
          stock, "isPublic", "isActive", "companyId", "entryDate", "expiresAt"
        )
        VALUES (
          p_name, p_sku, p_price, p_cost, p_description, p_category,
          p_stock, p_is_public, p_is_active, p_company_id, p_entry_date, p_expires_at
        )
        RETURNING * INTO v_row;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_update_product(
        p_id          UUID,
        p_name        VARCHAR       DEFAULT NULL,
        p_sku         VARCHAR       DEFAULT NULL,
        p_price       NUMERIC(12,2) DEFAULT NULL,
        p_cost        NUMERIC(12,2) DEFAULT NULL,
        p_description VARCHAR       DEFAULT NULL,
        p_category    VARCHAR       DEFAULT NULL,
        p_is_public   BOOLEAN       DEFAULT NULL,
        p_is_active   BOOLEAN       DEFAULT NULL,
        p_entry_date  TIMESTAMPTZ   DEFAULT NULL,
        p_expires_at  TIMESTAMPTZ   DEFAULT NULL
      )
      RETURNS product AS $$
      DECLARE
        v_row product;
      BEGIN
        UPDATE product
        SET
          name         = COALESCE(p_name, name),
          sku          = COALESCE(p_sku, sku),
          price        = COALESCE(p_price, price),
          cost         = COALESCE(p_cost, cost),
          description  = COALESCE(p_description, description),
          category     = COALESCE(p_category, category),
          "isPublic"   = COALESCE(p_is_public, "isPublic"),
          "isActive"   = COALESCE(p_is_active, "isActive"),
          "entryDate"  = COALESCE(p_entry_date, "entryDate"),
          "expiresAt"  = COALESCE(p_expires_at, "expiresAt")
        WHERE id = p_id
        RETURNING * INTO v_row;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Producto con ID % no encontrado', p_id;
        END IF;

        RETURN v_row;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sp_delete_product(p_id UUID)
      RETURNS VOID AS $$
      BEGIN
        DELETE FROM product WHERE id = p_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Producto con ID % no encontrado', p_id;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DOWN: revertir todos los objetos creados
  // ───────────────────────────────────────────────────────────────────────────
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_customers_set_updated_at ON customers`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_suppliers_set_updated_at ON suppliers`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_investment_set_updated_at ON investment`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_income_audit ON income`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_expense_audit ON expense`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_investment_audit ON investment`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_low_stock_alert ON product`,
    );

    // Trigger functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_set_updated_at()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_audit_income()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_audit_expense()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_audit_investment()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_low_stock_alert()`);

    // Stored procedures
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_create_income(NUMERIC, VARCHAR, UUID, VARCHAR, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_update_income(INT, NUMERIC, VARCHAR, VARCHAR, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS sp_delete_income(INT)`);

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_create_expense(NUMERIC, VARCHAR, UUID, VARCHAR, VARCHAR, TIMESTAMP, TIMESTAMP)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_update_expense(INT, NUMERIC, VARCHAR, VARCHAR, VARCHAR, TIMESTAMP, TIMESTAMP)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS sp_delete_expense(INT)`);

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_create_investment(NUMERIC, VARCHAR, UUID, VARCHAR, TIMESTAMP, TIMESTAMP, TIMESTAMP)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_update_investment(INT, NUMERIC, VARCHAR, VARCHAR, TIMESTAMP, TIMESTAMP, TIMESTAMP)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_delete_investment(INT)`,
    );

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_create_customer(VARCHAR, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, NUMERIC, NUMERIC)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_update_customer(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS sp_delete_customer(UUID)`);

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_register_customer_payment(UUID, NUMERIC, TIMESTAMPTZ, VARCHAR, TEXT, UUID)`,
    );

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_reserve_product_stock(UUID, INT)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_restore_product_stock(UUID, INT)`,
    );

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_create_product(VARCHAR, VARCHAR, NUMERIC, NUMERIC, UUID, VARCHAR, VARCHAR, INT, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sp_update_product(UUID, VARCHAR, VARCHAR, NUMERIC, NUMERIC, VARCHAR, VARCHAR, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS sp_delete_product(UUID)`);

    // Tablas auxiliares
    await queryRunner.query(`DROP TABLE IF EXISTS stock_alerts`);
    await queryRunner.query(`DROP TABLE IF EXISTS financial_audit_log`);
  }
}
