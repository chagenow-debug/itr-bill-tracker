import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * ONE-TIME migration endpoint to add previous_bill_number column
 * Handles bill renumbering (e.g., HSB 123 -> HF 123)
 *
 * Trigger by opening this in your browser:
 * https://your-vercel-app.com/api/admin/migrate-add-previous
 */
export async function GET() {
  try {
    console.log("[migrate-add-previous] Starting migration...");

    // Check if column already exists
    const checkResult = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='bills' AND column_name='previous_bill_number'
    `);

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        {
          message: "Column already exists",
          note: "previous_bill_number column is already present in bills table"
        },
        { status: 200 }
      );
    }

    // Add the column
    console.log("[migrate-add-previous] Adding previous_bill_number column...");
    await query(`
      ALTER TABLE bills
      ADD COLUMN previous_bill_number VARCHAR(255)
    `);

    console.log("[migrate-add-previous] Migration complete");

    return NextResponse.json(
      {
        message: "Migration complete",
        note: "Added previous_bill_number column to bills table"
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[migrate-add-previous] Error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
