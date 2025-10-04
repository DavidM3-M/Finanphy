import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCompaniesIdType1759029740422 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ALTER COLUMN "id" TYPE UUID;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ALTER COLUMN "id" TYPE VARCHAR;
    `);
  }
}