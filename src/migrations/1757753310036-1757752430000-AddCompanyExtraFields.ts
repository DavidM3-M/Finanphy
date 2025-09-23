// src/migrations/1757752430000-AddCompanyExtraFields.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyExtraFields1757752430000 implements MigrationInterface {
    name = 'AddCompanyExtraFields1757752430000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD COLUMN IF NOT EXISTS "fiscalAddress" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD COLUMN IF NOT EXISTS "city" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD COLUMN IF NOT EXISTS "state" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD COLUMN IF NOT EXISTS "representativeName" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD COLUMN IF NOT EXISTS "representativeDocument" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            ADD COLUMN IF NOT EXISTS "incorporationDate" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "companies"
            DROP COLUMN IF EXISTS "incorporationDate"
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            DROP COLUMN IF EXISTS "representativeDocument"
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            DROP COLUMN IF EXISTS "representativeName"
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            DROP COLUMN IF EXISTS "state"
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            DROP COLUMN IF EXISTS "city"
        `);
        await queryRunner.query(`
            ALTER TABLE "companies"
            DROP COLUMN IF EXISTS "fiscalAddress"
        `);
    }
}