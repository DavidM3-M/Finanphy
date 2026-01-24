import { DataSource } from 'typeorm';
import dns from 'dns';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const resolveIPv4 = async (): Promise<DataSource> => {
  return new Promise((resolve, reject) => {
    dns.lookup(
      'db.krxovbzkxowzkxonfs.supabase.co',
      { family: 4 },
      (err, address) => {
        if (err) return reject(err);

        const AppDataSource = new DataSource({
          type: 'postgres',
          host: address,
          port: 5432,
          username: 'postgres',
          password: process.env.POSTGRES_PASSWORD,
          database: 'Finanphy',
          ssl: { rejectUnauthorized: false },
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

        resolve(AppDataSource);
      },
    );
  });
};
