import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET() {
  try {
    console.log('[TEST QUERY] Starting simple SELECT 1 test...');
    const result = await query("SELECT 1 as result");
    console.log('[TEST QUERY] Success:', result);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[TEST QUERY] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
