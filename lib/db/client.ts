import pg from 'pg';

const Client = pg.Client;

// Capitalize first letter of each word (Title Case)
function capitalizeFirstWordOnly(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const trimmed = text.trim();
  return trimmed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Generate URL for Iowa Legislature bill
function generateBillUrl(billNumber: string, gaNumber: string = "91"): string {
  // Remove spaces from bill number for URL (e.g., "HF 2011" -> "HF2011")
  const cleanBillNumber = billNumber.replace(/\s+/g, "");
  return `https://www.legis.iowa.gov/legislation/BillBook?ba=${cleanBillNumber}&ga=${gaNumber}`;
}

// For serverless, create fresh client connection per query
// This avoids pool state issues across function invocations
export async function query(text: string, params?: (string | number | boolean | null)[]): Promise<any> {
  // Prefer regular postgres:// connection string over prisma+postgres://
  // The native pg module doesn't understand prisma+postgres:// URLs
  const connectionString = process.env.DATABASE_URL ||
                         process.env.POSTGRES_PRISMA_URL ||
                         process.env.DATABASE_PRISMA_DATABASE_URL;

  if (!connectionString) {
    throw new Error('[DB] No database connection string found');
  }

  console.log('[DB] Attempting connection with:', connectionString.substring(0, 50) + '...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },  // Required for Prisma Accelerate
  });

  try {
    console.log('[DB] Connecting...');
    await client.connect();
    console.log('[DB] Connected');
    const result = params && params.length > 0
      ? await client.query(text, params)
      : await client.query(text);
    console.log('[DB] Query executed');
    return result;
  } catch (error) {
    console.error('[DB] Error:', error);
    throw error;
  } finally {
    try {
      await client.end();
    } catch (e) {
      console.log('[DB] Error closing connection:', e);
    }
  }
}

export async function getAllBills() {
  try {
    // Try with is_pinned column first (handles new schema)
    const result = await query(
      "SELECT * FROM bills ORDER BY is_pinned DESC, bill_number ASC"
    );

    // Auto-generate URLs for bills that don't have them
    const billsWithoutUrls = result.rows.filter((bill: any) => !bill.url);
    if (billsWithoutUrls.length > 0) {
      console.log(`[DB] Auto-generating URLs for ${billsWithoutUrls.length} bills`);
      for (const bill of billsWithoutUrls) {
        try {
          const url = generateBillUrl(bill.bill_number);
          await query(
            "UPDATE bills SET url = $1, updated_at = NOW() WHERE id = $2",
            [url, bill.id]
          );
        } catch (e) {
          console.log(`[DB] Error updating URL for bill ${bill.bill_number}:`, e);
        }
      }
    }

    return result.rows;
  } catch (error: any) {
    // If is_pinned column doesn't exist, try to create it
    if (error.message?.includes('is_pinned') || error.message?.includes('column') || error.code === '42703') {
      try {
        console.log('[DB] Creating is_pinned column...');
        await query(
          'ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE'
        );
        console.log('[DB] is_pinned column created');

        // Retry the query with is_pinned
        const result = await query(
          "SELECT * FROM bills ORDER BY is_pinned DESC, bill_number ASC"
        );
        return result.rows;
      } catch (alterError) {
        console.log('[DB] Error creating column:', alterError);
        // Fallback to query without is_pinned
        const result = await query(
          "SELECT * FROM bills ORDER BY bill_number ASC"
        );
        return result.rows;
      }
    }
    // Re-throw if it's a different error
    throw error;
  }
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
  is_pinned?: boolean;
}) {
  // Auto-generate URL if not provided
  const billUrl = (data.url && data.url.trim() !== '') ? data.url : generateBillUrl(data.bill_number);

  const result = await query(
    `INSERT INTO bills (
      bill_number, companion_bills, chamber, title, short_title, description,
      committee, committee_key, status, position, sponsor, subcommittee,
      fiscal_note, lsb, url, notes, is_pinned, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
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
      billUrl,
      data.notes || null,
      data.is_pinned || false,
    ]
  );
  return result.rows[0];
}

export async function updateBill(id: number, data: any) {
  // List of valid columns that can be updated
  const validColumns = [
    'bill_number', 'companion_bills', 'chamber', 'title', 'short_title',
    'description', 'committee', 'committee_key', 'status', 'position',
    'sponsor', 'subcommittee', 'fiscal_note', 'lsb', 'url', 'notes', 'is_pinned'
  ];

  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  // Process all valid columns
  for (const column of validColumns) {
    if (!(column in data)) continue; // Skip columns not in data

    let value = data[column];

    // Special case: if title is empty but short_title is provided, use short_title
    if (column === 'title' && (value === '' || value === null || value === undefined) && data.short_title && data.short_title.trim() !== '') {
      value = data.short_title;
    }

    // Convert empty strings to null
    const finalValue = value === '' ? null : value;

    fields.push(`${column} = $${paramCount}`);
    values.push(finalValue);
    paramCount++;
  }

  // If no valid fields to update, return the existing bill
  if (fields.length === 0) {
    return getBillById(id);
  }

  // Add updated_at
  fields.push(`updated_at = NOW()`);
  values.push(id);
  paramCount++;

  const sql = `UPDATE bills SET ${fields.join(", ")} WHERE id = $${paramCount - 1} RETURNING *`;
  console.log('[DB] updateBill SQL:', sql);
  console.log('[DB] updateBill values:', values);

  const result = await query(sql, values);
  return result.rows[0];
}

export async function deleteBill(id: number) {
  const result = await query(
    "DELETE FROM bills WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
}

export async function upsertBill(data: {
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
  is_pinned?: boolean;
}) {
  // Auto-generate URL if not provided
  const billUrl = (data.url && data.url.trim() !== '') ? data.url : generateBillUrl(data.bill_number);

  // Capitalize short_title: Title Case (capitalize first letter of each word)
  const capitalizedShortTitle = capitalizeFirstWordOnly(data.short_title);

  // PostgreSQL UPSERT: INSERT ... ON CONFLICT ... DO UPDATE
  // Preserve is_pinned and fiscal_note from existing record if not explicitly provided
  const result = await query(
    `INSERT INTO bills (
      bill_number, companion_bills, chamber, title, short_title, description,
      committee, committee_key, status, position, sponsor, subcommittee,
      fiscal_note, lsb, url, notes, is_pinned, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
    )
    ON CONFLICT (bill_number) DO UPDATE SET
      companion_bills = $2,
      chamber = $3,
      title = $4,
      short_title = $5,
      description = $6,
      committee = $7,
      committee_key = $8,
      status = $9,
      position = $10,
      sponsor = $11,
      subcommittee = $12,
      fiscal_note = COALESCE($13, bills.fiscal_note),
      lsb = $14,
      url = $15,
      notes = $16,
      is_pinned = COALESCE(NULLIF($17::text, 'false')::boolean, bills.is_pinned, false),
      updated_at = NOW()
    RETURNING *`,
    [
      data.bill_number,
      data.companion_bills || null,
      data.chamber,
      data.title,
      capitalizedShortTitle,
      data.description || null,
      data.committee || null,
      data.committee_key || null,
      data.status || null,
      data.position,
      data.sponsor || null,
      data.subcommittee || null,
      data.fiscal_note || null,
      data.lsb || null,
      billUrl,
      data.notes || null,
      data.is_pinned === undefined ? null : data.is_pinned,
    ]
  );
  return result.rows[0];
}
