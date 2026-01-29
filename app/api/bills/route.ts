import { NextRequest, NextResponse } from "next/server";
import { getAllBills, createBill } from "@/lib/db/client";
import { validateSession } from "@/lib/auth";

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

    const bill = await createBill({
      bill_number: data.bill_number,
      companion_bills: data.companion_bills || undefined,
      chamber: data.chamber,
      title: data.title,
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
      url: data.url || undefined,
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
