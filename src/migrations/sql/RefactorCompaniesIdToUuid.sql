-- Paso 1: Agregar columna uuid temporal en companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'id_uuid'
  ) THEN
    ALTER TABLE companies ADD COLUMN id_uuid uuid DEFAULT uuid_generate_v4();
    ALTER TABLE companies ADD CONSTRAINT companies_id_uuid_unique UNIQUE (id_uuid);
  END IF;
END
$$;

-- PRODUCT
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product') THEN
    ALTER TABLE product ADD COLUMN companyId_uuid uuid;

    ALTER TABLE product DROP CONSTRAINT IF EXISTS "FK_product_companyId";
    ALTER TABLE product DROP COLUMN IF EXISTS "companyId";
    ALTER TABLE product RENAME COLUMN companyId_uuid TO "companyId";

    -- Reinstalar la FOREIGN KEY apuntando a companies.id (uuid)
    ALTER TABLE product ADD CONSTRAINT "FK_product_companyId"
      FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- INCOME
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'income') THEN
    ALTER TABLE income ADD COLUMN companyId_uuid uuid;
    ALTER TABLE income DROP CONSTRAINT IF EXISTS "FK_income_companyId";
    ALTER TABLE income DROP COLUMN IF EXISTS "companyId";
    ALTER TABLE income RENAME COLUMN companyId_uuid TO "companyId";
  END IF;
END
$$;

-- EXPENSE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expense') THEN
    ALTER TABLE expense ADD COLUMN companyId_uuid uuid;
    ALTER TABLE expense DROP CONSTRAINT IF EXISTS "FK_expense_companyId";
    ALTER TABLE expense DROP COLUMN IF EXISTS "companyId";
    ALTER TABLE expense RENAME COLUMN companyId_uuid TO "companyId";
  END IF;
END
$$;

-- INVESTMENT
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investment') THEN
    ALTER TABLE investment ADD COLUMN companyId_uuid uuid;
    ALTER TABLE investment DROP CONSTRAINT IF EXISTS "FK_investment_companyId";
    ALTER TABLE investment DROP COLUMN IF EXISTS "companyId";
    ALTER TABLE investment RENAME COLUMN companyId_uuid TO "companyId";
  END IF;
END
$$;

-- Paso final: migrar id_uuid a id en companies
DO $$
BEGIN
  IF EXISTS (
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'id_uuid'
  ) THEN
    ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_id_uuid_unique;
    ALTER TABLE companies DROP CONSTRAINT IF EXISTS "PK_d4bc3e82a314fa9e29f652c2c22";
    ALTER TABLE companies DROP CONSTRAINT IF EXISTS "FK_6d64e8c7527a9e4af83cc66cbf7";
    ALTER TABLE companies DROP COLUMN IF EXISTS id;
    ALTER TABLE companies RENAME COLUMN id_uuid TO id;
    ALTER TABLE companies ADD PRIMARY KEY (id);
  END IF;
END
$$;

-- Reinstalar FOREIGN KEYs apuntando a companies.id
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product') THEN
    ALTER TABLE product ADD CONSTRAINT "FK_product_companyId" FOREIGN KEY ("companyId") REFERENCES companies(id);
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'income') THEN
    ALTER TABLE income ADD CONSTRAINT "FK_income_companyId" FOREIGN KEY ("companyId") REFERENCES companies(id);
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expense') THEN
    ALTER TABLE expense ADD CONSTRAINT "FK_expense_companyId" FOREIGN KEY ("companyId") REFERENCES companies(id);
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investment') THEN
    ALTER TABLE investment ADD CONSTRAINT "FK_investment_companyId" FOREIGN KEY ("companyId") REFERENCES companies(id);
  END IF;
END
$$;