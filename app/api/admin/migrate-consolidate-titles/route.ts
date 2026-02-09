import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * ONE-TIME migration endpoint to consolidate short_title and title into subject
 * Consolidates two title fields into a single "subject" field
 *
 * Trigger by opening this in your browser:
 * https://your-vercel-app.com/api/admin/migrate-consolidate-titles
 */
export async function GET() {
  try {
    console.log("[migrate-consolidate-titles] Starting migration...");

    // Check if subject column already exists
    const checkResult = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='bills' AND column_name='subject'
    `);

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        {
          message: "Column already exists",
          note: "subject column is already present in bills table"
        },
        { status: 200 }
      );
    }

    // Add the subject column
    console.log("[migrate-consolidate-titles] Adding subject column...");
    await query(`
      ALTER TABLE bills
      ADD COLUMN subject VARCHAR(500)
    `);

    // Migrate data from short_title to subject
    console.log("[migrate-consolidate-titles] Migrating data from short_title to subject...");
    await query(`
      UPDATE bills
      SET subject = short_title
      WHERE short_title IS NOT NULL AND short_title != ''
    `);

    console.log("[migrate-consolidate-titles] Migration complete");

    return NextResponse.json(
      {
        message: "Migration complete",
        note: "Added subject column and migrated data from short_title"
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[migrate-consolidate-titles] Error:", error);
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
