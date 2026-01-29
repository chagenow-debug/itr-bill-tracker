import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    DATABASE_PRISMA_DATABASE_URL: process.env.DATABASE_PRISMA_DATABASE_URL ? "SET" : "NOT_SET",
    DATABASE_PRISMA_URL: process.env.DATABASE_PRISMA_URL ? "SET" : "NOT_SET",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT_SET",
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "SET" : "NOT_SET",
    POSTGRES_URL: process.env.POSTGRES_URL ? "SET" : "NOT_SET",
  };

  // Log the actual values (safely)
  if (process.env.DATABASE_PRISMA_DATABASE_URL) {
    const url = new URL(process.env.DATABASE_PRISMA_DATABASE_URL);
    envVars.DATABASE_PRISMA_DATABASE_URL = `postgres://${url.hostname}:****@****`;
  }

  console.log('[TEST] Environment variables:', envVars);

  return NextResponse.json(envVars);
}
