import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { query } from "@/lib/db/client";
import Papa from "papaparse";

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

    // Parse CSV using Papa Parse for proper CSV handling
    const parseResult = Papa.parse(content, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      transformHeader: (h: string) =>
        h.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    if (!parseResult.data || parseResult.data.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or has no valid data rows" },
        { status: 400 }
      );
    }

    if (parseResult.errors && parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV file", details: parseResult.errors },
        { status: 400 }
      );
    }

    for (let i = 0; i < parseResult.data.length; i++) {
      const rawRow: any = parseResult.data[i];

      // Trim all values to remove leading/trailing whitespace
      const row: any = {};
      Object.keys(rawRow).forEach(key => {
        row[key] = typeof rawRow[key] === "string" ? rawRow[key].trim() : rawRow[key];
      });

      // Validate required bill_number
      if (!row.bill_number) {
        errors.push(`Row ${i + 1}: Missing required field (bill_number)`);
        continue;
      }

      // Auto-derive chamber from bill_number if not provided
      if (!row.chamber) {
        // Match HF, HSB, HJ (House) or SF, SSB, SJ (Senate)
        const billMatch = row.bill_number.match(/^([HS])/i);
        if (billMatch) {
          row.chamber = billMatch[1].toUpperCase() === 'H' ? 'House' : 'Senate';
        } else {
          row.chamber = 'Unknown';
        }
      }

      // Use short_title as title if title is empty
      if (!row.title) {
        row.title = row.short_title || row.bill_number;
      }

      // Map position value to valid enum, or default to Monitor
      const validPositions = ["Support", "Against", "Monitor", "Undecided"];
      if (!row.position || !validPositions.includes(row.position)) {
        // Store the original status in the notes field if position is non-standard
        if (row.position && !validPositions.includes(row.position)) {
          row.notes = `Status: ${row.position}${row.notes ? ' | ' + row.notes : ''}`;
        }
        row.position = "Monitor"; // Default to Monitor for unspecified positions
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
        url: (row.url && row.url.trim() !== '') ? row.url : undefined,
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
        const result = await query(
          `INSERT INTO bills (
            bill_number, companion_bills, chamber, title, short_title, description,
            committee, committee_key, status, position, sponsor, subcommittee,
            fiscal_note, lsb, url, notes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
          ) RETURNING *`,
          [
            bill.bill_number,
            bill.companion_bills || null,
            bill.chamber,
            bill.title,
            bill.short_title,
            bill.description || null,
            bill.committee || null,
            bill.committee_key || null,
            bill.status || null,
            bill.position,
            bill.sponsor || null,
            bill.subcommittee || null,
            (bill.fiscal_note ? true : false) as any,
            bill.lsb || null,
            null, // Always null for URL since CSV has no URLs
            bill.notes || null,
          ]
        );
        insertedBills.push(result.rows[0]);
      } catch (error: any) {
        console.error(`Error inserting bill ${bill.bill_number}:`, error);
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
