
SET session_replication_role = replica;

-- Eliminar datos en orden inverso a las dependencias
DELETE FROM "product";
DELETE FROM "investment";
DELETE FROM "expense";
DELETE FROM "income";
DELETE FROM "companies";
DELETE FROM "user_entity";

-- Reactivar restricciones
SET session_replication_role = DEFAULT;