import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { validateSession } from "@/lib/auth";

export async function GET() {
  try {
    const result = await query(
      "SELECT * FROM bills ORDER BY bill_number ASC"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
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

    const data = await request.json();

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
        data.fiscal_note || false,
        data.lsb || null,
        data.url || null,
        data.notes || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
