import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * Debug endpoint to check current state of titles in database
 */
export async function GET() {
  try {
    console.log("[check-titles] Fetching all titles...");

    const result = await query(`
      SELECT id, bill_number, short_title
      FROM bills
      WHERE short_title IS NOT NULL
      ORDER BY id
      LIMIT 20
    `);

    const titles = result.rows as any[];
    console.log("[check-titles] Found", titles.length, "titles");

    // Analyze the titles to see what pattern they're in
    const analysis = titles.map((t: any) => ({
      id: t.id,
      bill_number: t.bill_number,
      short_title: t.short_title,
      isAllCaps: t.short_title === t.short_title.toUpperCase(),
      isCapitalized: t.short_title.charAt(0) === t.short_title.charAt(0).toUpperCase() && t.short_title.slice(1) === t.short_title.slice(1).toLowerCase(),
    }));

    return NextResponse.json(
      {
        total: titles.length,
        titles: analysis,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[check-titles] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to check titles",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
