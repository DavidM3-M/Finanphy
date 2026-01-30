import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIssuedAtDueAtToOrdersAndClientOrders1769226100000
  implements MigrationInterface
{
  name = 'AddIssuedAtDueAtToOrdersAndClientOrders1769226100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const supplierTable = (await queryRunner.query(
      `SELECT to_regclass('public.supplier_orders') as tbl`,
    )) as Array<{ tbl: string | null }>;
    if (supplierTable.length > 0 && supplierTable[0].tbl) {
      await queryRunner.query(
        `ALTER TABLE "supplier_orders" ADD COLUMN "issuedAt" timestamptz NOT NULL DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "supplier_orders" ADD COLUMN "dueAt" timestamptz`,
      );
    }

    const clientTable = (await queryRunner.query(
      `SELECT to_regclass('public.client_orders') as tbl`,
    )) as Array<{ tbl: string | null }>;
    if (clientTable.length > 0 && clientTable[0].tbl) {
      await queryRunner.query(
        `ALTER TABLE "client_orders" ADD COLUMN "issuedAt" timestamptz NOT NULL DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "client_orders" ADD COLUMN "dueAt" timestamptz`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const supplierTable = (await queryRunner.query(
      `SELECT to_regclass('public.supplier_orders') as tbl`,
    )) as Array<{ tbl: string | null }>;
    if (supplierTable.length > 0 && supplierTable[0].tbl) {
      await queryRunner.query(
        `ALTER TABLE "supplier_orders" DROP COLUMN IF EXISTS "issuedAt"`,
      );
      await queryRunner.query(
        `ALTER TABLE "supplier_orders" DROP COLUMN IF EXISTS "dueAt"`,
      );
    }

    const clientTable = (await queryRunner.query(
      `SELECT to_regclass('public.client_orders') as tbl`,
    )) as Array<{ tbl: string | null }>;
    if (clientTable.length > 0 && clientTable[0].tbl) {
      await queryRunner.query(
        `ALTER TABLE "client_orders" DROP COLUMN IF EXISTS "issuedAt"`,
      );
      await queryRunner.query(
        `ALTER TABLE "client_orders" DROP COLUMN IF EXISTS "dueAt"`,
      );
    }
  }
}
