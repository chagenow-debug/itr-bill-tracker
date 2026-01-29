import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { validateSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query(
      "SELECT * FROM bills WHERE id = $1",
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
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
    // Validate admin session
    const isAdmin = await validateSession();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];

    const fieldMap: { [key: string]: boolean } = {
      bill_number: true,
      companion_bills: true,
      chamber: true,
      title: true,
      short_title: true,
      description: true,
      committee: true,
      committee_key: true,
      status: true,
      position: true,
      sponsor: true,
      subcommittee: true,
      fiscal_note: true,
      lsb: true,
      url: true,
      notes: true,
    };

    Object.entries(data).forEach(([key, value]) => {
      if (fieldMap[key]) {
        updateFields.push(`${key} = $${values.length + 1}`);
        values.push(value === undefined ? null : value);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(parseInt(id));
    const queryStr = `UPDATE bills SET ${updateFields.join(", ")} WHERE id = $${values.length} RETURNING *`;

    const result = await query(queryStr, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating bill:", error);
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
    // Validate admin session
    const isAdmin = await validateSession();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await query(
      "DELETE FROM bills WHERE id = $1 RETURNING *",
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Bill deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json(
      { error: "Failed to delete bill" },
      { status: 500 }
    );
  }
}
