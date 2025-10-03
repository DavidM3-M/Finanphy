import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyUserRelation1758959999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Eliminar el constraint si ya existiera
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP CONSTRAINT IF EXISTS "FK_companies_userId";
    `);

    // 2) Volver a crearlo
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_companies_userId"
      FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Al revertir, basta con borrarlo
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP CONSTRAINT IF EXISTS "FK_companies_userId";
    `);
  }
}