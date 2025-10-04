import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingProductFields1759029740420 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'product' AND column_name = 'isPublic'
        ) THEN
          ALTER TABLE "product" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'product' AND column_name = 'isActive'
        ) THEN
          ALTER TABLE "product" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product' AND column_name = 'createdAt'
      ) THEN
        ALTER TABLE "product"
        ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now();
      END IF;
    END $$;
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product" DROP COLUMN IF EXISTS "isPublic";
      ALTER TABLE "product" DROP COLUMN IF EXISTS "isActive";
      ALTER TABLE "product" DROP COLUMN IF EXISTS "createdAt";
    `);
  }
}