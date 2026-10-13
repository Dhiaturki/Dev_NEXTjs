import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { CreateStudentSchema } from "@/lib/validation";

/**
 * GET /api/students
 * - Non connecté : 401 Unauthorized
 * - ADMIN / ENSEIGNANT : liste de tous les étudiants
 * - ETUDIANT : uniquement ses propres informations (ses données)
 * Ne retourne jamais le mot de passe / hash.
 */
export async function GET() {
  const auth = await requireRole();
  if (!auth.success) {
    return auth.response;
  }

  const { user } = auth;

  if (user.role === "ETUDIANT") {
    // L'étudiant ne consulte que ses propres informations
    const ownData = await prisma.user.findUnique({
      where: { id: user.id },
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

    return NextResponse.json(ownData ? [ownData] : []);
  }

  // ADMIN ou ENSEIGNANT : consultation de la liste des étudiants
  const students = await prisma.user.findMany({
    where: { role: "ETUDIANT" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      filiere: true,
      note: true,
      createdAt: true,
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(students);
}

/**
 * POST /api/students
 * - Non connecté : 401 Unauthorized
 * - ENSEIGNANT / ETUDIANT : 403 Forbidden
 * - ADMIN : création d'un nouvel étudiant
 * Valide avec Zod et ne stocke jamais de mot de passe en clair.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = CreateStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, filiere, note } = parsed.data;

    // Vérifier unicité email
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newStudent = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ETUDIANT",
        filiere: filiere || "Informatique",
        note: note !== undefined ? note : 14,
      },
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

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la création de l'étudiant" },
      { status: 500 }
    );
  }
}
