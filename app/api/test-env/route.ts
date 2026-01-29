import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    has_database_prisma_url: !!process.env.DATABASE_PRISMA_DATABASE_URL,
    has_postgres_prisma_url: !!process.env.POSTGRES_PRISMA_URL,
    has_database_url: !!process.env.DATABASE_URL,
    database_prisma_url_start: process.env.DATABASE_PRISMA_DATABASE_URL?.substring(0, 30),
    postgres_prisma_url_start: process.env.POSTGRES_PRISMA_URL?.substring(0, 30),
    database_url_start: process.env.DATABASE_URL?.substring(0, 30),
  });
}
