-- =============================================================================
-- FINANPHY - ESPECIFICACIÓN DE PROCEDIMIENTOS ALMACENADOS Y TRIGGERS
-- Migración: 1769500000000-CreateStoredProceduresAndTriggers
-- Base de datos: PostgreSQL (finanphy)
-- =============================================================================


-- =============================================================================
-- TABLAS AUXILIARES
-- =============================================================================

/*
  financial_audit_log
  ───────────────────
  Registra cada INSERT, UPDATE y DELETE sobre las tablas financieras
  (income, expense, investment). Los datos anteriores y nuevos se
  almacenan como JSONB para trazabilidad completa.

  Columnas:
    id          BIGSERIAL    PK autoincremental
    table_name  VARCHAR(50)  Nombre de la tabla auditada
    record_id   VARCHAR(40)  ID del registro afectado (cast a texto)
    action      VARCHAR(10)  'INSERT' | 'UPDATE' | 'DELETE'
    old_data    JSONB        Estado anterior del registro (NULL en INSERT)
    new_data    JSONB        Estado nuevo del registro (NULL en DELETE)
    changed_at  TIMESTAMPTZ  Momento del cambio (DEFAULT NOW())

  Índice: idx_audit_log_table_record (table_name, record_id)
*/

/*
  stock_alerts
  ────────────
  Registra automáticamente una alerta cuando el stock de un producto
  cae por debajo del umbral definido (por defecto: 5 unidades).

  Columnas:
    id          BIGSERIAL    PK autoincremental
    productId   UUID         FK → product.id
    stock       INT          Valor de stock en el momento de la alerta
    threshold   INT          Umbral que disparó la alerta
    alerted_at  TIMESTAMPTZ  Momento de la alerta (DEFAULT NOW())
*/


-- =============================================================================
-- FUNCIONES DE TRIGGER
-- =============================================================================

/*
  fn_set_updated_at()
  ───────────────────
  Actualiza automáticamente la columna "updatedAt" al momento actual
  antes de cada UPDATE.

  Tablas que usan este trigger:
    customers → trg_customers_set_updated_at  (BEFORE UPDATE)
    suppliers → trg_suppliers_set_updated_at  (BEFORE UPDATE)
    investment→ trg_investment_set_updated_at (BEFORE UPDATE)
*/

/*
  fn_audit_income()
  ─────────────────
  Registra en financial_audit_log cualquier cambio sobre la tabla income.
  Trigger: trg_income_audit (AFTER INSERT OR UPDATE OR DELETE ON income)
*/

/*
  fn_audit_expense()
  ──────────────────
  Registra en financial_audit_log cualquier cambio sobre la tabla expense.
  Trigger: trg_expense_audit (AFTER INSERT OR UPDATE OR DELETE ON expense)
*/

/*
  fn_audit_investment()
  ─────────────────────
  Registra en financial_audit_log cualquier cambio sobre la tabla investment.
  Trigger: trg_investment_audit (AFTER INSERT OR UPDATE OR DELETE ON investment)
*/

/*
  fn_low_stock_alert()
  ────────────────────
  Se dispara cuando el stock de un producto cae de >= 5 a < 5.
  Inserta una fila en stock_alerts con el stock actual y el umbral.
  Trigger: trg_low_stock_alert (AFTER UPDATE OF stock ON product)
*/


-- =============================================================================
-- TRIGGERS - RESUMEN
-- =============================================================================
/*
  Nombre                          Tabla       Evento                    Función
  ──────────────────────────────  ──────────  ────────────────────────  ─────────────────────────
  trg_customers_set_updated_at    customers   BEFORE UPDATE             fn_set_updated_at()
  trg_suppliers_set_updated_at    suppliers   BEFORE UPDATE             fn_set_updated_at()
  trg_investment_set_updated_at   investment  BEFORE UPDATE             fn_set_updated_at()
  trg_income_audit                income      AFTER INSERT/UPDATE/DEL   fn_audit_income()
  trg_expense_audit               expense     AFTER INSERT/UPDATE/DEL   fn_audit_expense()
  trg_investment_audit            investment  AFTER INSERT/UPDATE/DEL   fn_audit_investment()
  trg_low_stock_alert             product     AFTER UPDATE OF stock     fn_low_stock_alert()
*/


-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS — INCOME
-- =============================================================================

/*
  sp_create_income
  ────────────────
  Crea un nuevo registro de ingreso.
  Valida que amount > 0.
  entryDate default: NOW() si no se proporciona.

  FIRMA:
    sp_create_income(
      p_amount         NUMERIC(12,2),
      p_category       VARCHAR,
      p_company_id     UUID,
      p_description    VARCHAR     DEFAULT NULL,
      p_invoice_number VARCHAR     DEFAULT NULL,
      p_entry_date     TIMESTAMPTZ DEFAULT NULL,
      p_due_date       TIMESTAMPTZ DEFAULT NULL,
      p_order_id       UUID        DEFAULT NULL,
      p_customer_id    UUID        DEFAULT NULL
    ) RETURNS income

  EJEMPLO:
    SELECT * FROM sp_create_income(
      1500.00, 'venta', 'uuid-empresa',
      'Descripción', 'INV-001', NOW(), NULL, NULL, NULL
    );
*/

/*
  sp_update_income
  ────────────────
  Actualiza campos de un ingreso existente (solo los que no son NULL).
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_update_income(
      p_id             INT,
      p_amount         NUMERIC(12,2) DEFAULT NULL,
      p_category       VARCHAR       DEFAULT NULL,
      p_description    VARCHAR       DEFAULT NULL,
      p_invoice_number VARCHAR       DEFAULT NULL,
      p_entry_date     TIMESTAMPTZ   DEFAULT NULL,
      p_due_date       TIMESTAMPTZ   DEFAULT NULL
    ) RETURNS income

  EJEMPLO:
    SELECT * FROM sp_update_income(42, 2000.00, NULL, 'Nueva desc', NULL, NULL, NULL);
*/

/*
  sp_delete_income
  ────────────────
  Elimina un ingreso por ID.
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_delete_income(p_id INT) RETURNS VOID

  EJEMPLO:
    SELECT sp_delete_income(42);
*/


-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS — EXPENSE
-- =============================================================================

/*
  sp_create_expense
  ─────────────────
  Crea un nuevo registro de gasto.
  Valida que amount > 0.

  FIRMA:
    sp_create_expense(
      p_amount      NUMERIC(12,2),
      p_category    VARCHAR,
      p_company_id  UUID,
      p_description VARCHAR   DEFAULT NULL,
      p_supplier    VARCHAR   DEFAULT NULL,
      p_entry_date  TIMESTAMP DEFAULT NULL,
      p_due_date    TIMESTAMP DEFAULT NULL
    ) RETURNS expense

  EJEMPLO:
    SELECT * FROM sp_create_expense(
      800.00, 'servicios', 'uuid-empresa',
      'Internet', 'Proveedor S.A.', NOW(), NULL
    );
*/

/*
  sp_update_expense
  ─────────────────
  Actualiza campos de un gasto existente (solo los que no son NULL).
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_update_expense(
      p_id          INT,
      p_amount      NUMERIC(12,2) DEFAULT NULL,
      p_category    VARCHAR       DEFAULT NULL,
      p_description VARCHAR       DEFAULT NULL,
      p_supplier    VARCHAR       DEFAULT NULL,
      p_entry_date  TIMESTAMP     DEFAULT NULL,
      p_due_date    TIMESTAMP     DEFAULT NULL
    ) RETURNS expense

  EJEMPLO:
    SELECT * FROM sp_update_expense(10, 900.00, NULL, NULL, 'Nuevo proveedor', NULL, NULL);
*/

/*
  sp_delete_expense
  ─────────────────
  Elimina un gasto por ID.
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_delete_expense(p_id INT) RETURNS VOID

  EJEMPLO:
    SELECT sp_delete_expense(10);
*/


-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS — INVESTMENT
-- =============================================================================

/*
  sp_create_investment
  ────────────────────
  Crea un nuevo registro de inversión.
  Valida que amount > 0.

  FIRMA:
    sp_create_investment(
      p_amount         NUMERIC(12,2),
      p_category       VARCHAR,
      p_company_id     UUID,
      p_invoice_number VARCHAR   DEFAULT NULL,
      p_entry_date     TIMESTAMP DEFAULT NULL,
      p_exit_date      TIMESTAMP DEFAULT NULL,
      p_due_date       TIMESTAMP DEFAULT NULL
    ) RETURNS investment

  EJEMPLO:
    SELECT * FROM sp_create_investment(
      50000.00, 'maquinaria', 'uuid-empresa',
      'FAC-2026', NOW(), NULL, '2027-01-01'
    );
*/

/*
  sp_update_investment
  ────────────────────
  Actualiza campos de una inversión (solo los que no son NULL).
  Actualiza "updatedAt" automáticamente.
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_update_investment(
      p_id             INT,
      p_amount         NUMERIC(12,2) DEFAULT NULL,
      p_category       VARCHAR       DEFAULT NULL,
      p_invoice_number VARCHAR       DEFAULT NULL,
      p_entry_date     TIMESTAMP     DEFAULT NULL,
      p_exit_date      TIMESTAMP     DEFAULT NULL,
      p_due_date       TIMESTAMP     DEFAULT NULL
    ) RETURNS investment

  EJEMPLO:
    SELECT * FROM sp_update_investment(5, 60000.00, NULL, NULL, NULL, NULL, NULL);
*/

/*
  sp_delete_investment
  ────────────────────
  Elimina una inversión por ID.
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_delete_investment(p_id INT) RETURNS VOID

  EJEMPLO:
    SELECT sp_delete_investment(5);
*/


-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS — CUSTOMER
-- =============================================================================

/*
  sp_create_customer
  ──────────────────
  Crea un nuevo cliente asociado a una empresa.
  Valida que debt >= 0 y credit >= 0.

  FIRMA:
    sp_create_customer(
      p_name        VARCHAR,
      p_company_id  UUID,
      p_email       VARCHAR       DEFAULT NULL,
      p_phone       VARCHAR       DEFAULT NULL,
      p_document_id VARCHAR       DEFAULT NULL,
      p_address     VARCHAR       DEFAULT NULL,
      p_notes       TEXT          DEFAULT NULL,
      p_debt        NUMERIC(12,2) DEFAULT 0,
      p_credit      NUMERIC(12,2) DEFAULT 0
    ) RETURNS customers

  EJEMPLO:
    SELECT * FROM sp_create_customer(
      'Juan Pérez', 'uuid-empresa',
      'juan@email.com', '3001234567', 'CC-123456',
      'Calle 1 #2-3', 'Cliente frecuente', 0, 0
    );
*/

/*
  sp_update_customer
  ──────────────────
  Actualiza datos de contacto de un cliente (solo los que no son NULL).
  Actualiza "updatedAt" automáticamente.
  No modifica debt/credit (esos se gestionan via pagos).
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_update_customer(
      p_id          UUID,
      p_name        VARCHAR DEFAULT NULL,
      p_email       VARCHAR DEFAULT NULL,
      p_phone       VARCHAR DEFAULT NULL,
      p_document_id VARCHAR DEFAULT NULL,
      p_address     VARCHAR DEFAULT NULL,
      p_notes       TEXT    DEFAULT NULL
    ) RETURNS customers

  EJEMPLO:
    SELECT * FROM sp_update_customer(
      'uuid-cliente', 'Juan P. Actualizado',
      NULL, '3009876543', NULL, NULL, NULL
    );
*/

/*
  sp_delete_customer
  ──────────────────
  Elimina un cliente por ID.
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_delete_customer(p_id UUID) RETURNS VOID

  EJEMPLO:
    SELECT sp_delete_customer('uuid-cliente');
*/


-- =============================================================================
-- PROCEDIMIENTO ALMACENADO — CUSTOMER PAYMENT
-- =============================================================================

/*
  sp_register_customer_payment
  ────────────────────────────
  Registra un pago de cliente y actualiza su saldo (debt/credit)
  de forma atómica con FOR UPDATE (bloqueo pesimista).

  Lógica de saldo:
    - Si pago >= deuda actual → deuda = 0, excedente suma a crédito
    - Si pago < deuda actual  → deuda se reduce en el monto pagado

  Lanza excepción si:
    - amount <= 0
    - El cliente no existe

  FIRMA:
    sp_register_customer_payment(
      p_customer_id    UUID,
      p_amount         NUMERIC(12,2),
      p_paid_at        TIMESTAMPTZ  DEFAULT NOW(),
      p_payment_method VARCHAR      DEFAULT NULL,
      p_note           TEXT         DEFAULT NULL,
      p_order_id       UUID         DEFAULT NULL
    ) RETURNS customer_payments

  EJEMPLO:
    SELECT * FROM sp_register_customer_payment(
      'uuid-cliente',
      500.00,
      NOW(),
      'transferencia',
      'Abono cuota 1',
      'uuid-orden'
    );
*/


-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS — PRODUCT STOCK
-- =============================================================================

/*
  sp_reserve_product_stock
  ────────────────────────
  Descuenta stock de un producto con bloqueo pesimista (FOR UPDATE).
  Valida que quantity > 0 y que haya stock suficiente.

  Lanza excepción si:
    - quantity <= 0
    - El producto no existe
    - stock < quantity

  FIRMA:
    sp_reserve_product_stock(
      p_product_id UUID,
      p_quantity   INT
    ) RETURNS VOID

  EJEMPLO:
    SELECT sp_reserve_product_stock('uuid-producto', 3);
*/

/*
  sp_restore_product_stock
  ────────────────────────
  Devuelve stock a un producto (al cancelar/revertir una orden).
  Valida que quantity > 0 y que el producto exista.

  FIRMA:
    sp_restore_product_stock(
      p_product_id UUID,
      p_quantity   INT
    ) RETURNS VOID

  EJEMPLO:
    SELECT sp_restore_product_stock('uuid-producto', 3);
*/


-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS — PRODUCT CRUD
-- =============================================================================

/*
  sp_create_product
  ─────────────────
  Crea un nuevo producto.
  Valida price >= 0, cost >= 0, stock >= 0.

  FIRMA:
    sp_create_product(
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
    ) RETURNS product

  EJEMPLO:
    SELECT * FROM sp_create_product(
      'Camiseta Azul', 'CAM-001', 45000.00, 20000.00,
      'uuid-empresa', 'Camiseta talla M', 'ropa',
      100, TRUE, TRUE, NOW(), NULL
    );
*/

/*
  sp_update_product
  ─────────────────
  Actualiza campos de un producto (solo los que no son NULL).
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_update_product(
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
    ) RETURNS product

  EJEMPLO:
    SELECT * FROM sp_update_product(
      'uuid-producto', 'Camiseta Azul V2',
      NULL, 50000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    );
*/

/*
  sp_delete_product
  ─────────────────
  Elimina un producto por ID.
  Lanza excepción si el ID no existe.

  FIRMA:
    sp_delete_product(p_id UUID) RETURNS VOID

  EJEMPLO:
    SELECT sp_delete_product('uuid-producto');
*/


-- =============================================================================
-- CONSULTAS DE VERIFICACIÓN EN BD
-- =============================================================================

-- Ver todos los triggers instalados
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Ver todos los procedimientos almacenados
SELECT routine_name, routine_type, data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'sp_%'
   OR routine_name LIKE 'fn_%'
ORDER BY routine_name;

-- Ver log de auditoría
SELECT * FROM financial_audit_log ORDER BY changed_at DESC LIMIT 20;

-- Ver alertas de stock bajo
SELECT sa.*, p.name AS product_name
FROM stock_alerts sa
JOIN product p ON p.id = sa."productId"
ORDER BY sa.alerted_at DESC;
