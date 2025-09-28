import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar .env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Opcional: debug de variables
console.log('.env existe?', fs.existsSync(envPath));
console.log('DB HOST:', process.env.POSTGRES_HOST);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USERNAME || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'finanphy',
  ssl: process.env.POSTGRES_SSL === 'true',

  entities: [
    path.join(__dirname, 'companies/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'users/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'finance/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'products/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'client_orders/entities/*.entity.{ts,js}')
  ],

  migrations: [
    path.join(__dirname, 'migrations/*.{ts,js}')
  ],

  // Cada migración en su propia transacción
  migrationsTransactionMode: 'each',

  synchronize: false,
  logging: false
});