import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5436', 10),
  user: process.env.POSTGRES_USERNAME || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DATABASE || 'finanphy',
});

client
  .connect()
  .then(() => {
    console.log('✅ Conexión exitosa con PostgreSQL');
    return client.end();
  })
  .catch((err) => {
    console.error('❌ Error de conexión:');
    console.error(err);
  });
