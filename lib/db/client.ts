import { Pool } from 'pg';

// Get the pooled connection string (PRISMA variants include connection pooling)
const getConnectionString = () => {
  const connStr = process.env.DATABASE_PRISMA_DATABASE_URL ||
                  process.env.DATABASE_PRISMA_URL ||
                  process.env.POSTGRES_PRISMA_URL;

  if (connStr) {
    console.log('[DB] Using pooled connection string from:',
      process.env.DATABASE_PRISMA_DATABASE_URL ? 'DATABASE_PRISMA_DATABASE_URL' :
      process.env.DATABASE_PRISMA_URL ? 'DATABASE_PRISMA_URL' :
      'POSTGRES_PRISMA_URL'
    );
  } else {
    console.error('[DB] No pooled connection string found. Available vars:', {
      has_db_prisma_database_url: !!process.env.DATABASE_PRISMA_DATABASE_URL,
      has_db_prisma_url: !!process.env.DATABASE_PRISMA_URL,
      has_postgres_prisma_url: !!process.env.POSTGRES_PRISMA_URL,
      has_database_url: !!process.env.DATABASE_URL,
      has_postgres_url: !!process.env.POSTGRES_URL,
    });
  }

  return connStr;
};

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error('No database connection string available');
    }

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000, // Increased from 5s to 15s for serverless cold starts
    });

    console.log('[DB] Pool created with connection config');
  }
  return pool;
}

export async function query(text: string, params?: (string | number | null)[]): Promise<any> {
  try {
    console.log('[DB] Getting pool connection...');
    const client = await getPool().connect();
    console.log('[DB] Connection acquired, executing query');
    try {
      if (params && params.length > 0) {
        console.log('[DB] Query with', params.length, 'parameters');
        return await client.query(text, params);
      }
      return await client.query(text);
    } finally {
      client.release();
      console.log('[DB] Connection released');
    }
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
}

export async function getAllBills() {
  const result = await query(
    "SELECT * FROM bills ORDER BY bill_number ASC"
  );
  return result.rows;
}

export async function getBillById(id: number) {
  const result = await query(
    "SELECT * FROM bills WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

export async function createBill(data: {
  bill_number: string;
  companion_bills?: string;
  chamber: string;
  title: string;
  short_title: string;
  description?: string;
  committee?: string;
  committee_key?: string;
  status?: string;
  position: "Support" | "Against" | "Monitor" | "Undecided";
  sponsor?: string;
  subcommittee?: string;
  fiscal_note?: string;
  lsb?: string;
  url?: string;
  notes?: string;
}) {
  const result = await query(
    `INSERT INTO bills (
      bill_number, companion_bills, chamber, title, short_title, description,
      committee, committee_key, status, position, sponsor, subcommittee,
      fiscal_note, lsb, url, notes, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
    ) RETURNING *`,
    [
      data.bill_number,
      data.companion_bills || null,
      data.chamber,
      data.title,
      data.short_title,
      data.description || null,
      data.committee || null,
      data.committee_key || null,
      data.status || null,
      data.position,
      data.sponsor || null,
      data.subcommittee || null,
      data.fiscal_note || null,
      data.lsb || null,
      data.url || null,
      data.notes || null,
    ]
  );
  return result.rows[0];
}

export async function updateBill(id: number, data: Partial<typeof createBill>) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    fields.push(`${key} = $${paramCount}`);
    values.push(value);
    paramCount++;
  });

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE bills SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteBill(id: number) {
  const result = await query(
    "DELETE FROM bills WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
}
