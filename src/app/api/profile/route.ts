import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/profile
 * Accessible aux rôles ADMIN, ENSEIGNANT et ETUDIANT
 * Retourne le profil de l'utilisateur connecté sans password
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié (401 Unauthorized)" },
      { status: 401 }
    );
  }

  return NextResponse.json(user);
}
