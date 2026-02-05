import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * ONE-TIME migration endpoint to add section_pin_order column
 * Allows pinning bills within their section (Priority, Registrations, Monitoring)
 *
 * Trigger by opening this in your browser:
 * https://your-vercel-app.com/api/admin/migrate-add-section-pin
 */
export async function GET() {
  try {
    console.log("[migrate-add-section-pin] Starting migration...");

    // Check if column already exists
    const checkResult = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='bills' AND column_name='section_pin_order'
    `);

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        {
          message: "Column already exists",
          note: "section_pin_order column is already present in bills table"
        },
        { status: 200 }
      );
    }

    // Add the column
    console.log("[migrate-add-section-pin] Adding section_pin_order column...");
    await query(`
      ALTER TABLE bills
      ADD COLUMN section_pin_order INTEGER
    `);

    console.log("[migrate-add-section-pin] Migration complete");

    return NextResponse.json(
      {
        message: "Migration complete",
        note: "Added section_pin_order column to bills table"
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[migrate-add-section-pin] Error:", error);
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
