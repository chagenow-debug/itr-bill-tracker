import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function GET() {
  try {
    const bills = await prisma.bills.findMany({
      orderBy: { bill_number: 'asc' },
    });
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

    const bill = await prisma.bills.create({
      data: {
        bill_number: data.bill_number,
        companion_bills: data.companion_bills || null,
        chamber: data.chamber,
        title: data.title,
        short_title: data.short_title,
        description: data.description || null,
        committee: data.committee || null,
        committee_key: data.committee_key || null,
        status: data.status || null,
        position: data.position,
        sponsor: data.sponsor || null,
        subcommittee: data.subcommittee || null,
        fiscal_note: data.fiscal_note || false,
        lsb: data.lsb || null,
        url: data.url || null,
        notes: data.notes || null,
      },
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
