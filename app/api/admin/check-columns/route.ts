import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * Debug endpoint to check which columns exist in bills table
 */
export async function GET() {
  try {
    console.log("[check-columns] Checking bills table columns...");

    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name='bills'
      ORDER BY ordinal_position
    `);

    const columns = result.rows;
    console.log("[check-columns] Found", columns.length, "columns");

    return NextResponse.json(
      {
        total: columns.length,
        columns: columns.map(c => ({ name: c.column_name, type: c.data_type })),
        hasPreviousBillNumber: columns.some(c => c.column_name === 'previous_bill_number'),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[check-columns] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to check columns",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
