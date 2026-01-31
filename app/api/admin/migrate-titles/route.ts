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

    // Get all bills with a short_title value
    const result = await query("SELECT id, short_title FROM bills WHERE short_title IS NOT NULL AND short_title != ''");
    const bills = result.rows;
    console.log("[migrate-titles] Found", bills.length, "bills with short_title");

    let updated = 0;
    const changes = [];

    // Process each bill
    for (const bill of bills) {
      if (!bill.short_title) continue;

      const newTitle = bill.short_title.charAt(0).toUpperCase() + bill.short_title.slice(1).toLowerCase();

      // Update ALL bills, not just ones that changed
      console.log(`[migrate-titles] Updating bill ${bill.id}: "${bill.short_title}" -> "${newTitle}"`);
      await query(
        "UPDATE bills SET short_title = $1, updated_at = NOW() WHERE id = $2",
        [newTitle, bill.id]
      );
      updated++;
      changes.push({
        id: bill.id,
        from: bill.short_title,
        to: newTitle,
      });
    }

    console.log("[migrate-titles] Migration complete. Updated", updated, "bills");

    return NextResponse.json(
      {
        message: "Migration complete",
        updated,
        changes: changes.slice(0, 10), // Show first 10 changes
        moreChanges: updated > 10 ? `... and ${updated - 10} more` : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[migrate-titles] Error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: error.message },
      { status: 500 }
    );
  }
}
