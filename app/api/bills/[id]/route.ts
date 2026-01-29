import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bill = await prisma.bills.findUnique({
      where: { id: parseInt(id) },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await validateSession();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    const bill = await prisma.bills.update({
      where: { id: parseInt(id) },
      data,
    });

    return NextResponse.json(bill);
  } catch (error: any) {
    console.error("Error updating bill:", error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update bill" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await validateSession();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await prisma.bills.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: "Bill deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting bill:", error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete bill" },
      { status: 500 }
    );
  }
}
