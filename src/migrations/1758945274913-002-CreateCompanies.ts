import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateCompanies1758945274913 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'tradeName',
            type: 'varchar',
          },
          {
            name: 'legalName',
            type: 'varchar',
          },
          {
            name: 'companyType',
            type: 'varchar',
          },
          {
            name: 'taxId',
            type: 'varchar',
          },
          {
            name: 'taxRegistry',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'businessPurpose',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'companyEmail',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'companyPhone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'fiscalAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'representativeName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'representativeDocument',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'incorporationDate',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'companies',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user_entity',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('companies');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) =>
        fk.columnNames.includes('userId'),
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('companies', foreignKey);
      }
    }

    await queryRunner.dropTable('companies', true);
  }
}
