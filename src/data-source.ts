import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables desde .env
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL, // ← Usa la cadena completa con usuario, contraseña, host, puerto y SSL
  ssl: {
    rejectUnauthorized: false // ← Necesario para Supabase con sslmode=require
  },
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
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: false
});