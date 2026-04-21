-- =============================================================================
-- TEST-TRIGGERS.SQL
-- Pruebas completas de los 7 triggers de Finanphy
-- Ejecutar en pgAdmin conectado a la DB de Render
--
-- ANTES DE EMPEZAR: reemplaza los UUIDs con valores reales de tu DB:
--   :company_id  → SELECT id FROM companies LIMIT 1;
--   :customer_id → SELECT id FROM customers LIMIT 1;
--   :product_id  → SELECT id FROM products  LIMIT 1;
--   :supplier_id → SELECT id FROM suppliers LIMIT 1;
-- =============================================================================


-- =============================================================================
-- PASO 0: Obtener IDs reales para usar en los tests
-- =============================================================================

SELECT 'COMPANIES' AS tabla, id, name FROM companies LIMIT 3;
SELECT 'CUSTOMERS' AS tabla, id, name FROM customers LIMIT 3;
SELECT 'PRODUCTS'  AS tabla, id, name, stock FROM products LIMIT 3;
SELECT 'SUPPLIERS' AS tabla, id, name FROM suppliers LIMIT 3;
SELECT 'USERS'     AS tabla, id, email FROM users LIMIT 3;


-- =============================================================================
-- TEST 1: trg_customers_set_updated_at
-- Tabla: customers | Evento: BEFORE UPDATE
-- Espera: la columna "updatedAt" cambia automáticamente al hacer cualquier UPDATE
-- =============================================================================

-- 1a. Ver updatedAt actual
SELECT id, name, "updatedAt" FROM customers LIMIT 1;

-- 1b. Actualizar un campo cualquiera (reemplaza el UUID)
UPDATE customers
SET name = name
WHERE id = 'REEMPLAZA-CON-UUID-CUSTOMER';

-- 1c. Verificar que updatedAt cambió (debe ser muy reciente)
SELECT id, name, "updatedAt" FROM customers
WHERE id = 'REEMPLAZA-CON-UUID-CUSTOMER';


-- =============================================================================
-- TEST 2: trg_suppliers_set_updated_at
-- Tabla: suppliers | Evento: BEFORE UPDATE
-- Espera: igual que TEST 1 pero en proveedores
-- =============================================================================

SELECT id, name, "updatedAt" FROM suppliers LIMIT 1;

UPDATE suppliers
SET name = name
WHERE id = 'REEMPLAZA-CON-UUID-SUPPLIER';

SELECT id, name, "updatedAt" FROM suppliers
WHERE id = 'REEMPLAZA-CON-UUID-SUPPLIER';


-- =============================================================================
-- TEST 3: trg_investment_set_updated_at
-- Tabla: investment | Evento: BEFORE UPDATE
-- Espera: igual que TEST 1 pero en inversiones
-- =============================================================================

SELECT id, amount, "updatedAt" FROM investment LIMIT 1;

UPDATE investment
SET amount = amount
WHERE id = (SELECT id FROM investment LIMIT 1);

SELECT id, amount, "updatedAt" FROM investment
ORDER BY "updatedAt" DESC LIMIT 1;


-- =============================================================================
-- TEST 4: trg_income_audit
-- Tabla: income | Evento: AFTER INSERT OR UPDATE OR DELETE
-- Espera: cada operación genera una fila en financial_audit_log
-- =============================================================================

-- 4a. INSERT → debe generar action='INSERT' en audit log
-- (reemplaza el UUID de company)
SELECT * FROM sp_create_income(
  100.00,
  'venta',
  'REEMPLAZA-CON-UUID-COMPANY',
  'Test trigger audit INSERT',
  'INV-TRIG-001',
  NOW(),
  NULL,
  NULL,
  NULL
);

-- 4b. Ver log generado por el INSERT
SELECT id, table_name, action, record_id, new_data->>'amount' AS amount, changed_at
FROM financial_audit_log
WHERE table_name = 'income'
ORDER BY changed_at DESC LIMIT 3;

-- 4c. UPDATE → debe generar action='UPDATE' con old_data y new_data
UPDATE income
SET description = 'Descripción actualizada por trigger test'
WHERE "invoiceNumber" = 'INV-TRIG-001';

-- 4d. Ver log del UPDATE (debe tener old_data y new_data)
SELECT id, action,
  old_data->>'description' AS desc_anterior,
  new_data->>'description' AS desc_nueva,
  changed_at
FROM financial_audit_log
WHERE table_name = 'income' AND action = 'UPDATE'
ORDER BY changed_at DESC LIMIT 3;

-- 4e. DELETE → debe generar action='DELETE' con old_data
DELETE FROM income WHERE "invoiceNumber" = 'INV-TRIG-001';

-- 4f. Ver log del DELETE (solo old_data, new_data es NULL)
SELECT id, action,
  old_data->>'amount'   AS amount,
  new_data              AS new_data_debe_ser_null,
  changed_at
FROM financial_audit_log
WHERE table_name = 'income' AND action = 'DELETE'
ORDER BY changed_at DESC LIMIT 3;


-- =============================================================================
-- TEST 5: trg_expense_audit
-- Tabla: expense | Evento: AFTER INSERT OR UPDATE OR DELETE
-- Espera: igual que TEST 4 pero en gastos
-- =============================================================================

-- 5a. INSERT
SELECT * FROM sp_create_expense(
  50.00,
  'servicios',
  '0e5fd8fc-63dc-4cb0-a32d-2ffc59eead56'::UUID,
  'Test trigger audit gasto',
  NULL,
  NOW()::TIMESTAMP,
  NULL
);

-- 5b. Ver log
SELECT id, table_name, action, new_data->>'amount' AS amount, changed_at
FROM financial_audit_log
WHERE table_name = 'expense'
ORDER BY changed_at DESC LIMIT 3;

-- 5c. UPDATE
UPDATE expense
SET description = 'Gasto actualizado trigger test'
WHERE description = 'Test trigger audit gasto';

-- 5d. DELETE
DELETE FROM expense WHERE description = 'Gasto actualizado trigger test';

-- 5e. Ver todo el log de expense
SELECT id, action, old_data->>'amount', new_data->>'amount', changed_at
FROM financial_audit_log
WHERE table_name = 'expense'
ORDER BY changed_at DESC LIMIT 5;


-- =============================================================================
-- TEST 6: trg_investment_audit
-- Tabla: investment | Evento: AFTER INSERT OR UPDATE OR DELETE
-- Espera: igual que TEST 4 pero en inversiones
-- =============================================================================

-- 6a. INSERT
SELECT * FROM sp_create_investment(
  5000.00,
  'maquinaria',
  'REEMPLAZA-CON-UUID-COMPANY',
  'FAC-TRIG-001',
  NOW(),
  NULL,
  NULL
);

-- 6b. Ver log
SELECT id, table_name, action, new_data->>'amount', changed_at
FROM financial_audit_log
WHERE table_name = 'investment'
ORDER BY changed_at DESC LIMIT 3;

-- 6c. UPDATE
UPDATE investment
SET amount = 6000.00
WHERE "invoiceNumber" = 'FAC-TRIG-001';

-- 6d. DELETE
DELETE FROM investment WHERE "invoiceNumber" = 'FAC-TRIG-001';

-- 6e. Ver todo el log de investment
SELECT id, action,
  old_data->>'amount' AS monto_anterior,
  new_data->>'amount' AS monto_nuevo,
  changed_at
FROM financial_audit_log
WHERE table_name = 'investment'
ORDER BY changed_at DESC LIMIT 5;


-- =============================================================================
-- TEST 7: trg_low_stock_alert
-- Tabla: product | Evento: AFTER UPDATE OF stock
-- Espera: solo se dispara cuando stock CRUZA el umbral de 5 (de >= 5 a < 5)
-- =============================================================================

-- 7a. Forzar stock = 6 para que esté sobre el umbral
-- (reemplaza el UUID del producto)
UPDATE product SET stock = 6 WHERE id = 'REEMPLAZA-CON-UUID-PRODUCT';

SELECT id, name, stock FROM product WHERE id = 'REEMPLAZA-CON-UUID-PRODUCT';

-- 7b. Reservar 2 unidades → stock baja de 6 a 4 (CRUZA el umbral de 5)
--     Debe generar una fila en stock_alerts
SELECT * FROM sp_reserve_product_stock('REEMPLAZA-CON-UUID-PRODUCT', 2);

-- 7c. Verificar que se generó la alerta
SELECT sa.id, sa.stock, sa.threshold, sa.alerted_at, p.name AS producto
FROM stock_alerts sa
JOIN product p ON p.id = sa."productId"
WHERE sa."productId" = 'REEMPLAZA-CON-UUID-PRODUCT'
ORDER BY sa.alerted_at DESC LIMIT 3;

-- 7d. Bajar una unidad más (stock: 4 → 3) → NO genera alerta (ya estaba bajo el umbral)
SELECT * FROM sp_reserve_product_stock('REEMPLAZA-CON-UUID-PRODUCT', 1);

-- 7e. Confirmar que NO se agregó nueva alerta (mismo conteo que antes)
SELECT COUNT(*) AS total_alertas
FROM stock_alerts WHERE "productId" = 'REEMPLAZA-CON-UUID-PRODUCT';

-- 7f. Restaurar stock a 7 y volver a bajar → genera otra alerta
SELECT * FROM sp_restore_product_stock('REEMPLAZA-CON-UUID-PRODUCT', 4);
-- stock ahora = 7

SELECT * FROM sp_reserve_product_stock('REEMPLAZA-CON-UUID-PRODUCT', 3);
-- stock ahora = 4, cruza el umbral otra vez → nueva alerta

SELECT sa.id, sa.stock, sa.alerted_at
FROM stock_alerts
WHERE "productId" = 'REEMPLAZA-CON-UUID-PRODUCT'
ORDER BY alerted_at DESC LIMIT 5;


-- =============================================================================
-- RESUMEN FINAL: ver toda la actividad de auditoría generada
-- =============================================================================

SELECT
  al.id,
  al.table_name        AS tabla,
  al.action            AS operacion,
  al.record_id,
  al.changed_by        AS usuario,
  al.changed_at        AS momento
FROM financial_audit_log al
ORDER BY al.changed_at DESC
LIMIT 20;

-- Ver todas las alertas de stock
SELECT sa.id, p.name AS producto, sa.stock, sa.threshold, sa.alerted_at
FROM stock_alerts sa
JOIN product p ON p.id = sa."productId"
ORDER BY sa.alerted_at DESC
LIMIT 10;
