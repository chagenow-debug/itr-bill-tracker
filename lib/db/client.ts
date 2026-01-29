import pg from 'pg';

const Pool = pg.Pool;

// Create a connection pool using DATABASE_PRISMA_DATABASE_URL
// This is the Prisma Accelerate pooling endpoint
let pool: any = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_PRISMA_DATABASE_URL ||
                           process.env.POSTGRES_PRISMA_URL ||
                           process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('[DB] No database connection string found in environment variables');
    }

    console.log('[DB] Creating pool with connection string...');
    pool = new Pool({
      connectionString,
      max: 1,  // Single connection for serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,  // Generous timeout for cold starts
    });

    pool.on('error', (err: any) => {
      console.error('[DB] Pool error:', err);
      pool = null;
    });

    console.log('[DB] Pool created successfully');
  }

  return pool;
}

export async function query(text: string, params?: (string | number | null)[]): Promise<any> {
  const p = getPool();
  const client = await p.connect();

  try {
    console.log('[DB] Executing query');
    if (params && params.length > 0) {
      return await client.query(text, params);
    }
    return await client.query(text);
  } finally {
    client.release();
    console.log('[DB] Query completed');
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
