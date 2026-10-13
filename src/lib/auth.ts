import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/session";

export type Role = "ADMIN" | "ENSEIGNANT" | "ETUDIANT";

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: string;
  filiere: string | null;
  note: number | null;
  createdAt: Date;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await verifyToken(token);
    const userId = Number(payload.userId);
    if (!Number.isInteger(userId)) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        filiere: true,
        note: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export type RequireRoleResult =
  | { success: true; user: SafeUser; error: null; response: null }
  | { success: false; user: null; error: string; status: 401 | 403; response: NextResponse };

/**
 * Contrôle d'accès côté serveur (RBAC)
 * - 401 Unauthorized si non connecté
 * - 403 Forbidden si rôle non autorisé
 */
export async function requireRole(allowedRoles?: Role[]): Promise<RequireRoleResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      user: null,
      error: "Authentification requise",
      status: 401,
      response: NextResponse.json(
        { error: "Non authentifié (401 Unauthorized). Veuillez vous connecter." },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role as Role)) {
    return {
      success: false,
      user: null,
      error: "Accès refusé",
      status: 403,
      response: NextResponse.json(
        {
          error: `Accès interdit (403 Forbidden). Votre rôle (${user.role}) n'a pas les permissions requises.`,
        },
        { status: 403 }
      ),
    };
  }

  return { success: true, user, error: null, response: null };
}
