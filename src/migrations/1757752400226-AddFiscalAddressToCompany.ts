// src/migrations/1757752400226-AddFiscalAddressToCompany.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFiscalAddressToCompany1757752400226 implements MigrationInterface {
    name = 'AddFiscalAddressToCompany1757752400226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD COLUMN IF NOT EXISTS "fiscalAddress" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "companies"
            DROP COLUMN IF EXISTS "fiscalAddress"
        `);
    }
}