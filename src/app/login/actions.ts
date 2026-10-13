"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { createToken } from "@/lib/session";

export async function login(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return;
  }

  const token = await createToken(user.id, user.role);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2,
    path: "/",
  });

  redirect("/dashboard");
}
