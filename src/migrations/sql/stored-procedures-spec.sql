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


-- =============================================================================
-- GUÍA PASO A PASO: CÓMO FUNCIONA CADA TRIGGER
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TRIGGER 1: trg_customers_set_updated_at
-- Tabla    : customers
-- Evento   : BEFORE UPDATE (se ejecuta ANTES de que la fila sea modificada)
-- -----------------------------------------------------------------------------
/*
  PASO A PASO:
  1. El backend llama a sp_update_customer(...) o hace un UPDATE directo sobre customers.
  2. ANTES de escribir la fila, PostgreSQL invoca automáticamente fn_set_updated_at().
  3. fn_set_updated_at() asigna NEW."updatedAt" = NOW().
  4. La fila se guarda con la fecha de modificación actualizada.
  5. No requiere que el backend envíe el campo updatedAt — se gestiona solo.

  CÓMO PROBARLO:
    -- Guarda el updatedAt actual
    SELECT id, "updatedAt" FROM customers LIMIT 1;

    -- Actualiza cualquier campo
    UPDATE customers SET name = name WHERE id = 'uuid-cliente';

    -- Verifica que updatedAt cambió
    SELECT id, "updatedAt" FROM customers WHERE id = 'uuid-cliente';
*/

-- -----------------------------------------------------------------------------
-- TRIGGER 2: trg_suppliers_set_updated_at
-- Tabla    : suppliers
-- Evento   : BEFORE UPDATE
-- -----------------------------------------------------------------------------
/*
  PASO A PASO: Idéntico a trg_customers_set_updated_at pero sobre la tabla suppliers.

  CÓMO PROBARLO:
    SELECT id, "updatedAt" FROM suppliers LIMIT 1;
    UPDATE suppliers SET name = name WHERE id = 'uuid-proveedor';
    SELECT id, "updatedAt" FROM suppliers WHERE id = 'uuid-proveedor';
*/

-- -----------------------------------------------------------------------------
-- TRIGGER 3: trg_investment_set_updated_at
-- Tabla    : investment
-- Evento   : BEFORE UPDATE
-- -----------------------------------------------------------------------------
/*
  PASO A PASO: Idéntico pero sobre la tabla investment.

  CÓMO PROBARLO:
    SELECT id, "updatedAt" FROM investment LIMIT 1;
    SELECT * FROM sp_update_investment(<id>, 99999.00, NULL, NULL, NULL, NULL, NULL);
    SELECT id, "updatedAt" FROM investment WHERE id = <id>;
*/

-- -----------------------------------------------------------------------------
-- TRIGGER 4: trg_income_audit
-- Tabla    : income
-- Evento   : AFTER INSERT OR UPDATE OR DELETE
-- -----------------------------------------------------------------------------
/*
  PASO A PASO:
  1. Cualquier escritura sobre income (INSERT, UPDATE, DELETE) activa fn_audit_income().
  2. fn_audit_income() determina el tipo de operación (TG_OP).
  3. Construye un registro con:
       - table_name  = 'income'
       - record_id   = ID del registro afectado
       - action      = 'INSERT' | 'UPDATE' | 'DELETE'
       - old_data    = fila anterior en JSONB (NULL en INSERT)
       - new_data    = fila nueva en JSONB (NULL en DELETE)
       - changed_at  = NOW()
  4. Inserta ese registro en financial_audit_log.
  5. La operación original continúa normalmente (trigger AFTER, no la bloquea).

  CÓMO PROBARLO:
    -- Crear un income vía SP
    SELECT * FROM sp_create_income(
      'uuid-user', 'uuid-company', 100.00, 'venta',
      'INV-AUDIT-001', NOW(), NULL, 'Test auditoría', NULL
    );

    -- Ver el log generado automáticamente
    SELECT * FROM financial_audit_log
    WHERE table_name = 'income'
    ORDER BY changed_at DESC LIMIT 3;
*/

-- -----------------------------------------------------------------------------
-- TRIGGER 5: trg_expense_audit
-- Tabla    : expense
-- Evento   : AFTER INSERT OR UPDATE OR DELETE
-- -----------------------------------------------------------------------------
/*
  PASO A PASO: Idéntico a trg_income_audit pero registra cambios en la tabla expense.

  CÓMO PROBARLO:
    SELECT * FROM sp_create_expense(
      'uuid-user', 'uuid-company', 200.00, 'operativo',
      'EXP-AUDIT-001', NOW(), 'Test auditoría gasto'
    );

    SELECT * FROM financial_audit_log
    WHERE table_name = 'expense'
    ORDER BY changed_at DESC LIMIT 3;
*/

-- -----------------------------------------------------------------------------
-- TRIGGER 6: trg_investment_audit
-- Tabla    : investment
-- Evento   : AFTER INSERT OR UPDATE OR DELETE
-- -----------------------------------------------------------------------------
/*
  PASO A PASO: Idéntico pero registra cambios en la tabla investment.

  CÓMO PROBARLO:
    SELECT * FROM sp_create_investment(
      'uuid-user', 'uuid-company', 5000.00, 'maquinaria',
      'FAC-AUDIT-001', NOW(), NULL, NULL
    );

    SELECT * FROM financial_audit_log
    WHERE table_name = 'investment'
    ORDER BY changed_at DESC LIMIT 3;
*/

-- -----------------------------------------------------------------------------
-- TRIGGER 7: trg_low_stock_alert
-- Tabla    : product
-- Evento   : AFTER UPDATE OF stock
-- -----------------------------------------------------------------------------
/*
  PASO A PASO:
  1. Cuando sp_reserve_product_stock reduce el stock de un producto,
     PostgreSQL detecta que la columna "stock" fue modificada.
  2. fn_low_stock_alert() evalúa la condición:
       OLD.stock >= 5 AND NEW.stock < 5
     (solo dispara si el stock CRUZÓ el umbral, no en cada reducción)
  3. Si la condición es verdadera, inserta en stock_alerts:
       - productId  = ID del producto
       - stock      = nuevo valor de stock
       - threshold  = 5 (umbral fijo)
       - alerted_at = NOW()
  4. El backend puede consultar stock_alerts periódicamente para
     enviar notificaciones push o emails.

  CÓMO PROBARLO:
    -- Primero asegúrate de que el producto tiene stock >= 5
    UPDATE product SET stock = 6 WHERE id = 'uuid-producto';

    -- Reserva 2 unidades (stock baja de 6 a 4, cruza el umbral de 5)
    SELECT * FROM sp_reserve_product_stock('uuid-producto', 2);

    -- Verificar que se generó la alerta
    SELECT sa.*, p.name AS producto
    FROM stock_alerts sa
    JOIN product p ON p.id = sa."productId"
    WHERE sa."productId" = 'uuid-producto'
    ORDER BY sa.alerted_at DESC LIMIT 3;

    -- Restaurar stock (el trigger NO se dispara al subir, solo al bajar)
    SELECT * FROM sp_restore_product_stock('uuid-producto', 2);
*/

-- -----------------------------------------------------------------------------
-- CONSULTA UNIFICADA: ver toda la actividad reciente de auditoría
-- -----------------------------------------------------------------------------
/*
  SELECT
    al.id,
    al.table_name        AS tabla,
    al.action            AS operacion,
    al.record_id         AS registro_id,
    al.old_data ->> 'amount' AS monto_anterior,
    al.new_data ->> 'amount' AS monto_nuevo,
    al.changed_at        AS momento
  FROM financial_audit_log al
  ORDER BY al.changed_at DESC
  LIMIT 20;
*/
