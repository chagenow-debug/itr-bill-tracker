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

    // Generate URL if not provided
    const billUrl = (data.url && data.url.trim() !== '') ? data.url : generateBillUrl(data.bill_number);

    // Use short_title as title if title is not provided
    const title = (data.title && data.title.trim() !== '') ? data.title : data.short_title;

    const bill = await createBill({
      bill_number: data.bill_number,
      companion_bills: data.companion_bills || undefined,
      chamber: data.chamber,
      title: title,
      short_title: data.short_title,
      description: data.description || undefined,
      committee: data.committee || undefined,
      committee_key: data.committee_key || undefined,
      status: data.status || undefined,
      position: data.position,
      sponsor: data.sponsor || undefined,
      subcommittee: data.subcommittee || undefined,
      fiscal_note: data.fiscal_note || undefined,
      lsb: data.lsb || undefined,
      url: billUrl,
      notes: data.notes || undefined,
      is_pinned: data.is_pinned || false,
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
