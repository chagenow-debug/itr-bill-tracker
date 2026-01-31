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

    // First, check what titles we have
    const checkBefore = await query("SELECT COUNT(*) as count FROM bills WHERE short_title IS NOT NULL AND short_title != ''");
    console.log("[migrate-titles] Found", checkBefore.rows[0].count, "bills to process");

    // Sample before
    const sampleBefore = await query("SELECT id, short_title FROM bills WHERE short_title IS NOT NULL AND short_title != '' LIMIT 5");
    console.log("[migrate-titles] Sample before:", sampleBefore.rows);

    // Use PostgreSQL INITCAP to convert to title case
    // INITCAP capitalizes the first letter of each word
    const updateResult = await query(`
      UPDATE bills
      SET short_title = INITCAP(LOWER(short_title)),
          updated_at = NOW()
      WHERE short_title IS NOT NULL
        AND short_title != ''
      RETURNING id, short_title
    `);

    const updated = updateResult.rows.length;
    console.log("[migrate-titles] Migration complete. Updated", updated, "bills");
    console.log("[migrate-titles] Sample after:", updateResult.rows.slice(0, 5));

    return NextResponse.json(
      {
        message: "Migration complete",
        updated,
        sampleBefore: sampleBefore.rows,
        sampleAfter: updateResult.rows.slice(0, 5),
        note: "All short_title values have been converted to Title Case (First Letter Of Each Word Capitalized)"
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
