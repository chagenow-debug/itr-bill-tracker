import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  checkPassword,
  createSessionToken,
  verifySessionToken,
} from "./session";

export async function authenticate(password: string): Promise<boolean> {
  return checkPassword(password);
}

export async function createSession(): Promise<string> {
  const token = await createSessionToken();
  if (!token) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true, // Vercel is always HTTPS
    sameSite: "strict",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });

  return token;
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAdminAuth(): Promise<void> {
  const isValid = await validateSession();
  if (!isValid) {
    throw new Error("Unauthorized");
  }
}
