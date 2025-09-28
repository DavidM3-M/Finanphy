import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class RefactorCompaniesIdToUuid1758945274914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, 'sql', 'RefactorCompaniesIdToUuid.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(): Promise<void> {
    throw new Error('Manual rollback required for RefactorCompaniesIdToUuid');
  }
}