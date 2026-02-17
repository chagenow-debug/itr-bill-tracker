import { NextRequest, NextResponse } from "next/server";
import { getAllBills, createBill } from "@/lib/db/client";
import { validateSession } from "@/lib/auth";

// Generate URL for Iowa Legislature bill
function generateBillUrl(billNumber: string, gaNumber: string = "91"): string {
  // Remove spaces from bill number for URL (e.g., "HF 2011" -> "HF2011")
  const cleanBillNumber = billNumber.replace(/\s+/g, "");
  return `https://www.legis.iowa.gov/legislation/BillBook?ba=${cleanBillNumber}&ga=${gaNumber}`;
}

export async function GET() {
  try {
    const bills = await getAllBills();
    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
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

    const data = await request.json();

    // Clean up empty string values to null
    const cleanedData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === "" || value === undefined) {
        cleanedData[key] = null;
      } else {
        cleanedData[key] = value;
      }
    }

    // Generate URL if not provided
    const billUrl = (cleanedData.url && cleanedData.url.trim() !== '') ? cleanedData.url : generateBillUrl(cleanedData.bill_number);

    // Set default status to "Introduced" if not provided
    const status = cleanedData.status || "Introduced";

    const bill = await createBill({
      bill_number: cleanedData.bill_number,
      companion_bills: cleanedData.companion_bills || undefined,
      chamber: cleanedData.chamber,
      subject: cleanedData.subject,
      description: cleanedData.description || undefined,
      committee: cleanedData.committee || undefined,
      committee_key: cleanedData.committee_key || undefined,
      manager: cleanedData.manager || undefined,
      status: status,
      position: cleanedData.position,
      sponsor: cleanedData.sponsor || undefined,
      subcommittee: cleanedData.subcommittee || undefined,
      fiscal_note: cleanedData.fiscal_note || undefined,
      lsb: cleanedData.lsb || undefined,
      url: billUrl,
      notes: cleanedData.notes || undefined,
      is_pinned: cleanedData.is_pinned || false,
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bill:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error detail:", error.detail);
    console.error("Full error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: "Failed to create bill",
        details: error.message,
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
