import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Company } from './companies/entities/company.entity';
import { Income } from './finance/entities/income.entity';
import { Expense } from './finance/entities/expense.entity';
import { Investment } from './finance/entities/investment.entity';
import { Product } from './products/entities/product.entity';
import { UserEntity } from './users/entities/user.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Ruta absoluta al archivo .env
const envPath = path.resolve(__dirname, '../.env');

// Cargar variables de entorno
dotenv.config({ path: envPath });

// Verificación opcional para depuración
console.log('¿.env existe?', fs.existsSync(envPath));
console.log('HOST:', process.env.POSTGRES_HOST);
console.log('PORT:', process.env.POSTGRES_PORT);
console.log('USERNAME:', process.env.POSTGRES_USERNAME);
console.log('PASSWORD:', process.env.POSTGRES_PASSWORD);
console.log('DATABASE:', process.env.POSTGRES_DATABASE);

// Instancia de DataSource
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USERNAME || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'finanphy',
  entities: [Company, UserEntity, Income, Expense, Investment, Product],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
  ssl: process.env.POSTGRES_SSL === 'true',
});