import { sql } from '@vercel/postgres';

export async function query(text: string, params?: (string | number | null)[]): Promise<any> {
  try {
    if (params && params.length > 0) {
      return await sql.query(text, params);
    }
    return await sql.query(text);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getAllBills() {
  const result = await sql`
    SELECT * FROM bills ORDER BY bill_number ASC
  `;
  return result.rows;
}

export async function getBillById(id: number) {
  const result = await sql`
    SELECT * FROM bills WHERE id = ${id}
  `;
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
  const result = await sql`
    INSERT INTO bills (
      bill_number, companion_bills, chamber, title, short_title, description,
      committee, committee_key, status, position, sponsor, subcommittee,
      fiscal_note, lsb, url, notes, created_at, updated_at
    ) VALUES (
      ${data.bill_number},
      ${data.companion_bills || null},
      ${data.chamber},
      ${data.title},
      ${data.short_title},
      ${data.description || null},
      ${data.committee || null},
      ${data.committee_key || null},
      ${data.status || null},
      ${data.position},
      ${data.sponsor || null},
      ${data.subcommittee || null},
      ${data.fiscal_note || null},
      ${data.lsb || null},
      ${data.url || null},
      ${data.notes || null},
      NOW(),
      NOW()
    ) RETURNING *
  `;
  return result.rows[0];
}

export async function updateBill(id: number, data: Partial<typeof createBill>) {
  // Build dynamic update query
  const updates: string[] = [];
  const values: (string | number | null | boolean | undefined)[] = [];

  Object.entries(data).forEach(([key]) => {
    const value = data[key as keyof typeof data];
    updates.push(`${key} = $${updates.length + 1}`);
    values.push(value || null);
  });

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const queryText = `UPDATE bills SET ${updates.join(', ')} WHERE id = $${updates.length} RETURNING *`;
  const result = await sql.query(queryText, values);
  return result.rows[0];
}

export async function deleteBill(id: number) {
  const result = await sql`
    DELETE FROM bills WHERE id = ${id} RETURNING *
  `;
  return result.rows[0];
}
