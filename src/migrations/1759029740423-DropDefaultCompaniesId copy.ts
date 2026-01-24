import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDefaultCompaniesId1759029740423 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ALTER COLUMN "id" DROP DEFAULT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    `);
  }
}
