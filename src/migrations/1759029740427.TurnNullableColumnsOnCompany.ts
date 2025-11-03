import { MigrationInterface, QueryRunner } from 'typeorm';

export class TurnNullableColumnsOnCompany1759029740427 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
        ALTER COLUMN "legalName" DROP NOT NULL,
        ALTER COLUMN "companyType" DROP NOT NULL,
        ALTER COLUMN "taxId" DROP NOT NULL,
        ALTER COLUMN "taxRegistry" DROP NOT NULL,
        ALTER COLUMN "businessPurpose" DROP NOT NULL,
        ALTER COLUMN "companyEmail" DROP NOT NULL,
        ALTER COLUMN "companyPhone" DROP NOT NULL,
        ALTER COLUMN "fiscalAddress" DROP NOT NULL,
        ALTER COLUMN "city" DROP NOT NULL,
        ALTER COLUMN "state" DROP NOT NULL,
        ALTER COLUMN "representativeName" DROP NOT NULL,
        ALTER COLUMN "representativeDocument" DROP NOT NULL,
        ALTER COLUMN "incorporationDate" DROP NOT NULL,
        ALTER COLUMN "createdAt" DROP NOT NULL,
        ALTER COLUMN "updatedAt" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
        ALTER COLUMN "legalName" SET NOT NULL,
        ALTER COLUMN "companyType" SET NOT NULL,
        ALTER COLUMN "taxId" SET NOT NULL,
        ALTER COLUMN "taxRegistry" SET NOT NULL,
        ALTER COLUMN "businessPurpose" SET NOT NULL,
        ALTER COLUMN "companyEmail" SET NOT NULL,
        ALTER COLUMN "companyPhone" SET NOT NULL,
        ALTER COLUMN "fiscalAddress" SET NOT NULL,
        ALTER COLUMN "city" SET NOT NULL,
        ALTER COLUMN "state" SET NOT NULL,
        ALTER COLUMN "representativeName" SET NOT NULL,
        ALTER COLUMN "representativeDocument" SET NOT NULL,
        ALTER COLUMN "incorporationDate" SET NOT NULL,
        ALTER COLUMN "createdAt" SET NOT NULL,
        ALTER COLUMN "updatedAt" SET NOT NULL;
    `);
  }
}