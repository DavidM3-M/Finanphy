import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyUserRelation1758959999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_companies_userId"
      FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP CONSTRAINT IF EXISTS "FK_companies_userId";
    `);
  }
}