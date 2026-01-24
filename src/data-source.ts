import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables desde .env
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5436', 10),
  username: process.env.POSTGRES_USERNAME || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'finanphy',
  ssl:
    process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    path.join(__dirname, 'companies/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'users/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'finance/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'products/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'client_orders/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'reminders/entities/*.entity.{ts,js}'),
    path.join(__dirname, 'customers/entities/*.entity.{ts,js}'),
  ],
  migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: false,
});
