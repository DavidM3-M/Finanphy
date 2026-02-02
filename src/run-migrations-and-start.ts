import { AppDataSource } from './data-source';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    console.log('DB: initializing datasource...');
    await AppDataSource.initialize();
    console.log('DB: running pending migrations (if any)...');
    await AppDataSource.runMigrations({ transaction: 'each' });
    console.log('DB: migrations complete, closing datasource.');
    await AppDataSource.destroy();
  } catch (err) {
    console.error('Failed to run migrations:', err);
    process.exit(1);
  }

  // Start the compiled app entrypoint
  // When executed in production, dist/main.js should exist.
  // We spawn a new node process to run the built app.
  const { spawn } = await import('child_process');
  const child = spawn(process.execPath, ['dist/main.js'], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}

run();
