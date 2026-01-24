// src/db/db.service.ts
import {
  Injectable,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Pool, PoolClient, QueryConfig, QueryResult } from 'pg';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

@Injectable()
export class DbService implements OnModuleDestroy {
  private pool: Pool | null = null;
  private readonly logger = new Logger(DbService.name);

  private buildConnectionString(): string {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

    const user =
      process.env.POSTGRES_USERNAME || process.env.POSTGRES_USER || 'postgres';
    const pass =
      process.env.POSTGRES_PASSWORD || process.env.POSTGRES_PASS || '';
    const hostRaw = process.env.POSTGRES_HOST || '127.0.0.1';
    const host = hostRaw === 'localhost' ? '127.0.0.1' : hostRaw;
    const port = process.env.POSTGRES_PORT || '5432';
    const db = process.env.POSTGRES_DATABASE || 'postgres';
    const sslFlag =
      (process.env.POSTGRES_SSL || 'false').toLowerCase() === 'true';

    const auth = pass
      ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`
      : `${encodeURIComponent(user)}@`;
    const base = `postgres://${auth}${host}:${port}/${db}`;
    return sslFlag ? `${base}?ssl=true` : base;
  }

  private getPool(): Pool {
    if (this.pool) return this.pool;

    const connectionString = this.buildConnectionString();
    if (!connectionString) {
      this.logger.error('No connection string available for Postgres');
      throw new InternalServerErrorException('DATABASE_URL not provided');
    }

    this.pool = new Pool({
      connectionString,
      max: Number(process.env.DB_MAX_CLIENTS) || 10,
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
      connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS) || 5000,
      // ssl: { rejectUnauthorized: false } // enable if needed for remote DBs
    });

    this.logger.log(
      `Postgres pool created (lazy) - host from connection string`,
    );
    return this.pool;
  }

  private async connectWithRetry(attempts = 5, baseDelay = 200) {
    const pool = this.getPool();
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const client = await pool.connect();
        client.release();
        this.logger.log(`Postgres reachable (attempt ${i + 1})`);
        return;
      } catch (err) {
        lastErr = err;
        const delay = baseDelay * Math.pow(2, i);
        this.logger.warn(
          `DB connect attempt ${i + 1} failed. Retrying in ${delay}ms`,
        );
        await sleep(delay);
      }
    }
    this.logger.error(
      'No se pudo conectar a la DB después de reintentos',
      lastErr,
    );
    throw lastErr;
  }

  /**
   * Optional helper to proactively attempt connection (does not crash app if it fails).
   * Call ensureConnected() from bootstrap if you want early health checks.
   */
  async ensureConnected() {
    try {
      await this.connectWithRetry(
        Number(process.env.DB_CONNECT_RETRIES) || 5,
        Number(process.env.DB_CONNECT_BASE_DELAY_MS) || 200,
      );
    } catch (err) {
      this.logger.warn(
        'ensureConnected falló; próximas queries intentarán reconectar',
        err,
      );
    }
  }

  async query<T = any>(
    text: string | QueryConfig,
    params?: any[],
  ): Promise<QueryResult<T>> {
    const pool = this.getPool();
    let client: PoolClient | null = null;
    try {
      client = await pool.connect();
      return await client.query<T>(text as any, params);
    } catch (err) {
      this.logger.error(`Query error: ${err?.message || err}`, err);
      throw err;
    } finally {
      if (client) client.release();
    }
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    if (!this.pool) return;
    try {
      await this.pool.end();
      this.logger.log('Postgres pool closed');
    } catch (err) {
      this.logger.warn(`Error closing Postgres pool: ${err?.message}`);
    }
  }
}
