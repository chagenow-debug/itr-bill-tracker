import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { validateSession } from "@/lib/auth";

interface BillData {
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
  fiscal_note?: boolean | string;
  lsb?: string;
  url?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin session
    const isAdmin = await validateSession();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const bills: BillData[] = [];
    let errors: string[] = [];

    // Parse CSV
    const lines = content.split("\n").filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must contain header row and data" },
        { status: 400 }
      );
    }

    // Detect delimiter - try comma first, then tab, then multiple spaces
    let delimiter: string | RegExp = ",";
    if (!lines[0].includes(",") && lines[0].includes("\t")) {
      delimiter = "\t";
    } else if (!lines[0].includes(",") && !lines[0].includes("\t")) {
      // Try to detect multiple spaces as delimiter
      delimiter = /\s{2,}/;
    }

    const headers = lines[0].split(delimiter as any).map(h => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter as any).map(v => v.trim());

      // Allow some flexibility in column count (at least required fields)
      if (values.length < 4) {
        errors.push(`Row ${i + 1}: Not enough columns (need at least bill_number, chamber, title, position)`);
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });

      // Validate required fields
      if (!row.bill_number || !row.chamber || !row.title || !row.position) {
        errors.push(`Row ${i + 1}: Missing required fields (bill_number, chamber, title, position)`);
        continue;
      }

      // Validate position enum
      if (!["Support", "Against", "Monitor", "Undecided"].includes(row.position)) {
        errors.push(`Row ${i + 1}: Invalid position value. Must be: Support, Against, Monitor, or Undecided`);
        continue;
      }

      bills.push({
        bill_number: row.bill_number,
        companion_bills: row.companion_bills || undefined,
        chamber: row.chamber,
        title: row.title,
        short_title: row.short_title || row.title.substring(0, 50),
        description: row.description || undefined,
        committee: row.committee || undefined,
        committee_key: row.committee_key || undefined,
        status: row.status || undefined,
        position: row.position,
        sponsor: row.sponsor || undefined,
        subcommittee: row.subcommittee || undefined,
        fiscal_note: row.fiscal_note === "true" || row.fiscal_note === "1",
        lsb: row.lsb || undefined,
        url: row.url || undefined,
        notes: row.notes || undefined,
      });
    }

    if (bills.length === 0) {
      return NextResponse.json(
        {
          error: "No valid bills found in CSV",
          details: errors,
        },
        { status: 400 }
      );
    }

    // Insert bills into database
    const insertedBills = [];
    const insertErrors = [];

    for (const bill of bills) {
      try {
        const result = await sql`
          INSERT INTO bills (
            bill_number, companion_bills, chamber, title, short_title, description,
            committee, committee_key, status, position, sponsor, subcommittee,
            fiscal_note, lsb, url, notes, created_at, updated_at
          ) VALUES (
            ${bill.bill_number},
            ${bill.companion_bills || null},
            ${bill.chamber},
            ${bill.title},
            ${bill.short_title},
            ${bill.description || null},
            ${bill.committee || null},
            ${bill.committee_key || null},
            ${bill.status || null},
            ${bill.position},
            ${bill.sponsor || null},
            ${bill.subcommittee || null},
            ${bill.fiscal_note || false},
            ${bill.lsb || null},
            ${bill.url || null},
            ${bill.notes || null},
            NOW(),
            NOW()
          ) RETURNING *
        `;
        insertedBills.push(result.rows[0]);
      } catch (error: any) {
        if (error.message.includes("duplicate key")) {
          insertErrors.push(`Bill ${bill.bill_number}: Already exists in database`);
        } else {
          insertErrors.push(`Bill ${bill.bill_number}: ${error.message}`);
        }
      }
    }

    return NextResponse.json(
      {
        message: `Imported ${insertedBills.length} bills`,
        imported: insertedBills,
        errors: insertErrors,
        skipped: insertErrors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error importing bills:", error);
    return NextResponse.json(
      { error: "Failed to import bills" },
      { status: 500 }
    );
  }
}
