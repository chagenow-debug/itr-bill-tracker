import { createClient } from '@vercel/postgres';

// Manually create a client with explicit connection string
// We use DATABASE_PRISMA_DATABASE_URL which is the pooled connection from Prisma
let cachedClient: any = null;

async function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const connectionString = process.env.DATABASE_PRISMA_DATABASE_URL;

  if (!connectionString) {
    throw new Error('[DB] Missing DATABASE_PRISMA_DATABASE_URL');
  }

  console.log('[DB] Creating client with pooled connection...');
  cachedClient = createClient({ connectionString });

  try {
    console.log('[DB] Connecting to database...');
    await cachedClient.connect();
    console.log('[DB] Successfully connected to database');
  } catch (error) {
    console.error('[DB] Connection error:', error);
    cachedClient = null;
    throw error;
  }

  return cachedClient;
}

export async function query(text: string, params?: (string | number | null)[]): Promise<any> {
  try {
    const client = await getClient();
    if (params && params.length > 0) {
      console.log('[DB] Executing parameterized query');
      const result = await client.query(text, params);
      console.log('[DB] Query succeeded');
      return result;
    }
    console.log('[DB] Executing simple query');
    const result = await client.query(text);
    console.log('[DB] Query succeeded');
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    cachedClient = null;  // Reset on error to force reconnect
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
