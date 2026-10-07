import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_9cE6WDAxFiHj@ep-wandering-frog-aeohvckz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Neon serverless postgres connection pool
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return { rows: res.rows as T[], rowCount: res.rowCount };
  } finally {
    client.release();
  }
}

export default pool;
