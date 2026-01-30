import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductExpiresAt1769225500000 implements MigrationInterface {
  name = 'AddProductExpiresAt1769225500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD "expiresAt" timestamptz NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "expiresAt"`);
  }
}
