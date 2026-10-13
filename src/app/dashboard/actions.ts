"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { createToken } from "@/lib/session";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function quickLoginAs(role: "ADMIN" | "ENSEIGNANT" | "ETUDIANT"): Promise<void> {
  let targetEmail = "admin@ecole.tn";
  if (role === "ENSEIGNANT") targetEmail = "prof@ecole.tn";
  if (role === "ETUDIANT") targetEmail = "yasmine@etudiant.tn";

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
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
