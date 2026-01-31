import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * ONE-TIME migration endpoint to fix all existing all-caps titles
 * This should only be called once after deployment
 *
 * Trigger by opening this in your browser:
 * https://your-vercel-app.com/api/admin/migrate-titles
 */
export async function GET() {
  try {
    console.log("[migrate-titles] Starting migration...");

    // Use SQL-level transformation to capitalize all short_titles
    // Format: first letter uppercase, rest lowercase
    const updateResult = await query(`
      UPDATE bills
      SET short_title = CONCAT(
        UPPER(LEFT(short_title, 1)),
        LOWER(SUBSTRING(short_title, 2))
      ),
          updated_at = NOW()
      WHERE short_title IS NOT NULL
        AND short_title != ''
      RETURNING id, short_title
    `);

    const updated = updateResult.rows.length;
    console.log("[migrate-titles] Migration complete. Updated", updated, "bills");

    // Get before/after samples
    const allBills = await query("SELECT id, short_title FROM bills WHERE short_title IS NOT NULL LIMIT 5");

    return NextResponse.json(
      {
        message: "Migration complete",
        updated,
        sample: allBills.rows,
        note: "All short_title values have been capitalized (first word only)"
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[migrate-titles] Error:", error);
    console.error("[migrate-titles] Full error:", JSON.stringify(error, null, 2));
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
