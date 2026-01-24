import { MigrationInterface, QueryRunner } from 'typeorm';

export class TurnNullableColumnsOnCompany1759029740427
  implements MigrationInterface
{
  private readonly cols = [
    'legalName',
    'companyType',
    'taxId',
    'taxRegistry',
    'businessPurpose',
    'companyEmail',
    'companyPhone',
    'fiscalAddress',
    'city',
    'state',
    'representativeName',
    'representativeDocument',
    'incorporationDate',
    'createdAt',
    'updatedAt',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const col of this.cols) {
      const res: any[] = await queryRunner.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = $1`,
        [col],
      );
      if (res.length) {
        await queryRunner.query(
          `ALTER TABLE companies ALTER COLUMN "${col}" DROP NOT NULL`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of this.cols) {
      const res: any[] = await queryRunner.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = $1`,
        [col],
      );
      if (res.length) {
        await queryRunner.query(
          `ALTER TABLE companies ALTER COLUMN "${col}" SET NOT NULL`,
        );
      }
    }
  }
}
