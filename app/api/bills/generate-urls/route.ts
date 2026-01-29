import { NextRequest, NextResponse } from "next/server";
import { getAllBills } from "@/lib/db/client";
import { validateSession } from "@/lib/auth";
import { query } from "@/lib/db/client";

// Generate URL for Iowa Legislature bill
function generateBillUrl(billNumber: string, gaNumber: string = "91"): string {
  // Remove spaces from bill number for URL (e.g., "HF 2011" -> "HF2011")
  const cleanBillNumber = billNumber.replace(/\s+/g, "");
  return `https://www.legis.iowa.gov/legislation/BillBook?ba=${cleanBillNumber}&ga=${gaNumber}`;
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await validateSession();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all bills without URLs
    const bills = await getAllBills();
    const billsWithoutUrls = bills.filter((bill: any) => !bill.url);

    if (billsWithoutUrls.length === 0) {
      return NextResponse.json({
        message: "All bills already have URLs",
        updated: 0,
      });
    }

    // Update each bill without a URL
    const updated = [];
    for (const bill of billsWithoutUrls) {
      const url = generateBillUrl(bill.bill_number);
      await query(
        "UPDATE bills SET url = $1, updated_at = NOW() WHERE id = $2",
        [url, bill.id]
      );
      updated.push({
        id: bill.id,
        bill_number: bill.bill_number,
        url,
      });
    }

    return NextResponse.json({
      message: `Generated URLs for ${updated.length} bills`,
      updated,
    });
  } catch (error) {
    console.error("Error generating bill URLs:", error);
    return NextResponse.json(
      { error: "Failed to generate bill URLs" },
      { status: 500 }
    );
  }
}
