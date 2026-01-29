import pg from 'pg';

const Client = pg.Client;

// For serverless, create fresh client connection per query
// This avoids pool state issues across function invocations
export async function query(text: string, params?: (string | number | null)[]): Promise<any> {
  const connectionString = process.env.DATABASE_PRISMA_DATABASE_URL ||
                         process.env.POSTGRES_PRISMA_URL ||
                         process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('[DB] No database connection string found');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },  // Required for Prisma Accelerate
  });

  try {
    await client.connect();
    const result = params && params.length > 0
      ? await client.query(text, params)
      : await client.query(text);
    return result;
  } finally {
    await client.end();
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
