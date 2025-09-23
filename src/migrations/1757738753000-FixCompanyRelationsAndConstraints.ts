import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCompanyRelationsAndConstraints1757105000000
  implements MigrationInterface
{
  name = "FixCompanyRelationsAndConstraints1757105000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Helper inline para validar existencia de columna
    const ensureColumn = async (
      table: string,
      column: string,
      definition: string
    ) => {
      const exists = await queryRunner.query(
        `
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = '${table}'
          AND column_name = '${column}';
      `
      );
      if (exists.length === 0) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ADD COLUMN ${definition};`
        );
      }
    };

    // Helper inline para validar existencia de FK
    const ensureFK = async (
      table: string,
      fkName: string,
      column: string,
      referencedTable: string,
      referencedColumn: string = "id"
    ) => {
      const fkExists = await queryRunner.query(
        `
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = '${table}'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = '${fkName}';
      `
      );
      if (fkExists.length === 0) {
        await queryRunner.query(
          `
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${fkName}"
          FOREIGN KEY ("${column}") REFERENCES "${referencedTable}"("${referencedColumn}")
          ON DELETE CASCADE ON UPDATE CASCADE;
        `
        );
      }
    };

    // Tablas objetivo
    const tables = ["product", "income", "expense", "investment"];

    for (const tbl of tables) {
      // 1. Asegurar companyId
      await ensureColumn(tbl, "companyId", `"companyId" UUID`);

      // 2. Asegurar FK hacia companies
      await ensureFK(
        tbl,
        `FK_${tbl}_companyId`,
        "companyId",
        "companies"
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminamos sólo las FKs; mantenemos columnas por compatibilidad
    const tables = ["product", "income", "expense", "investment"];
    for (const tbl of tables) {
      await queryRunner.query(
        `ALTER TABLE "${tbl}" DROP CONSTRAINT IF EXISTS "FK_${tbl}_companyId";`
      );
    }
  }
}