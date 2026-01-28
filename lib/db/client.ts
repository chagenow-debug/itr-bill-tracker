import { createClient } from "@vercel/postgres";

let sqlClient: any = null;

async function getClient() {
  if (!sqlClient) {
    sqlClient = createClient({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });
    await sqlClient.connect();
  }
  return sqlClient;
}

export async function query(text: string, params?: (string | number | null)[]): Promise<any> {
  const client = await getClient();
  if (params) {
    return await client.query(text, params);
  }
  return await client.query(text);
}

export async function getAllBills() {
  const client = await getClient();
  const result = await client.query(
    "SELECT * FROM bills ORDER BY bill_number ASC"
  );
  return result.rows;
}

export async function getBillById(id: number) {
  const client = await getClient();
  const result = await client.query(
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
  const client = await getClient();
  const result = await client.query(
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

  const client = await getClient();
  const result = await client.query(
    `UPDATE bills SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteBill(id: number) {
  const client = await getClient();
  const result = await client.query(
    "DELETE FROM bills WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
}
