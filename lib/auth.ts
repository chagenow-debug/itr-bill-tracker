import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "default-password";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-key";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface SessionData {
  isAdmin: boolean;
  createdAt: number;
}

function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function authenticate(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD;
}

export async function createSession(): Promise<string> {
  const token = createSessionToken();
  const cookieStore = await cookies();

  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: true, // Always use secure in production (Vercel is HTTPS)
    sameSite: "strict",
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: "/",
  });

  return token;
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  console.log('[Auth] validateSession - token exists:', !!token);

  if (!token) {
    return false;
  }

  // In a real app, you'd verify the token against a database
  // For now, we just check if it exists
  return true;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}

export async function requireAdminAuth(): Promise<void> {
  const isValid = await validateSession();
  if (!isValid) {
    throw new Error("Unauthorized");
  }
}
