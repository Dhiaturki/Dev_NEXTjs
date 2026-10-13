// src/lib/session.ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default-secret-key-that-is-at-least-32-chars-long"
);

export async function createToken(userId: number, role?: string) {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
}

export async function verifyToken(token: string) {
  return jwtVerify(token, secret);
}
