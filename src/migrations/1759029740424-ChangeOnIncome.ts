import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeOnIncome1759029740424 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'income'
        ) THEN

          -- entryDate: si existe, hacer nullable, convertir a timestamptz e instalar DEFAULT CURRENT_TIMESTAMP
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'income' AND column_name = 'entryDate'
          ) THEN
            BEGIN
              EXECUTE 'ALTER TABLE "income" ALTER COLUMN "entryDate" DROP NOT NULL';
            EXCEPTION WHEN undefined_table THEN
              NULL;
            END;

            EXECUTE 'ALTER TABLE "income" ALTER COLUMN "entryDate" TYPE timestamp with time zone USING ("entryDate" AT TIME ZONE ''UTC'')';
            EXECUTE 'ALTER TABLE "income" ALTER COLUMN "entryDate" SET DEFAULT CURRENT_TIMESTAMP';
          END IF;

          -- dueDate: si existe, hacer nullable y convertir a timestamptz
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'income' AND column_name = 'dueDate'
          ) THEN
            BEGIN
              EXECUTE 'ALTER TABLE "income" ALTER COLUMN "dueDate" DROP NOT NULL';
            EXCEPTION WHEN undefined_table THEN
              NULL;
            END;

            EXECUTE 'ALTER TABLE "income" ALTER COLUMN "dueDate" TYPE timestamp with time zone USING ("dueDate" AT TIME ZONE ''UTC'')';
          END IF;

        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'income'
        ) THEN

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'income' AND column_name = 'entryDate'
          ) THEN
            EXECUTE 'ALTER TABLE "income" ALTER COLUMN "entryDate" TYPE timestamp USING ( ("entryDate" AT TIME ZONE ''UTC'') )';
            EXECUTE 'ALTER TABLE "income" ALTER COLUMN "entryDate" DROP DEFAULT';
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'income' AND column_name = 'dueDate'
          ) THEN
            EXECUTE 'ALTER TABLE "income" ALTER COLUMN "dueDate" TYPE timestamp USING ( ("dueDate" AT TIME ZONE ''UTC'') )';
          END IF;

        END IF;
      END$$;
    `);
  }
}