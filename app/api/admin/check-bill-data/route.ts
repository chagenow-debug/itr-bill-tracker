import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * Debug endpoint to see what data is returned from a bill record
 */
export async function GET() {
  try {
    console.log("[check-bill-data] Fetching sample bill...");

    const result = await query(`
      SELECT *
      FROM bills
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "No bills in database",
        },
        { status: 200 }
      );
    }

    const bill = result.rows[0];
    const fields = Object.keys(bill);

    console.log("[check-bill-data] Bill fields:", fields);

    return NextResponse.json(
      {
        message: "Sample bill data",
        fields: fields,
        hasPreviousBillNumber: fields.includes('previous_bill_number'),
        sampleBill: bill,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[check-bill-data] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to check bill data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
