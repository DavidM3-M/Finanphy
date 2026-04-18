/**
 * migrate-invoice-files.ts
 *
 * Moves existing invoice files from uploads/ root into organized subfolders:
 *   uploads/invoices/client-orders/
 *   uploads/invoices/expenses/
 *   uploads/invoices/supplier-orders/
 *
 * Also updates the invoiceUrl and invoiceFilename columns in the DB to reflect
 * the new paths.
 *
 * Run with:
 *   ts-node -r dotenv/config src/scripts/migrate-invoice-files.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const SUBDIRS = {
  'client-orders': path.join(UPLOADS_DIR, 'invoices', 'client-orders'),
  expenses: path.join(UPLOADS_DIR, 'invoices', 'expenses'),
  'supplier-orders': path.join(UPLOADS_DIR, 'invoices', 'supplier-orders'),
} as const;

type Category = keyof typeof SUBDIRS;

interface Row {
  id: string | number;
  invoiceFilename: string;
  invoiceUrl: string;
}

async function migrate() {
  // Ensure target dirs exist
  for (const dir of Object.values(SUBDIRS)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const client = new Client({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5436', 10),
    user: process.env.POSTGRES_USERNAME ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DATABASE ?? 'finanphy',
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log('Connected to DB\n');

  const tables: { table: string; idCol: string; category: Category }[] = [
    { table: 'client_orders', idCol: 'id', category: 'client-orders' },
    { table: 'expense', idCol: 'id', category: 'expenses' },
    { table: 'supplier_orders', idCol: 'id', category: 'supplier-orders' },
  ];

  let totalMoved = 0;
  let totalSkipped = 0;
  let totalMissing = 0;

  for (const { table, idCol, category } of tables) {
    // Only rows whose invoiceUrl points to the root /uploads/ (not already in a subfolder)
    const res = await client.query<Row>(
      `SELECT "${idCol}" AS id, "invoiceFilename", "invoiceUrl"
       FROM "${table}"
       WHERE "invoiceFilename" IS NOT NULL
         AND "invoiceUrl" LIKE '/uploads/%'
         AND "invoiceUrl" NOT LIKE '/uploads/invoices/%'`,
    );

    if (res.rows.length === 0) {
      console.log(`[${table}] No rows to migrate.`);
      continue;
    }

    console.log(`[${table}] Found ${res.rows.length} row(s) to migrate...`);

    const destDir = SUBDIRS[category];

    for (const row of res.rows) {
      const filename = row.invoiceFilename;
      const srcFile = path.join(UPLOADS_DIR, filename);
      const destFile = path.join(destDir, filename);
      const newUrl = `/uploads/invoices/${category}/${filename}`;

      if (!fs.existsSync(srcFile)) {
        console.warn(`  [MISSING]  ${filename} — file not on disk, updating DB only`);
        totalMissing++;
      } else {
        fs.renameSync(srcFile, destFile);
        console.log(`  [MOVED]    ${filename}  →  invoices/${category}/`);
        totalMoved++;
      }

      await client.query(
        `UPDATE "${table}" SET "invoiceUrl" = $1 WHERE "${idCol}" = $2`,
        [newUrl, row.id],
      );
    }

    console.log();
  }

  await client.end();

  console.log('─────────────────────────────');
  console.log(`Moved:   ${totalMoved}`);
  console.log(`Missing: ${totalMissing} (DB updated, file not found)`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log('Done.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
