import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export async function GET() {
  try {
    const isAuthenticated = await validateSession();

    if (!isAuthenticated) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { authenticated: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking auth:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
