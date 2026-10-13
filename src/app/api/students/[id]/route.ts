import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  AdminUpdateStudentSchema,
  TeacherUpdateStudentSchema,
} from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/students/[id]
 * - Non connecté : 401 Unauthorized
 * - ADMIN / ENSEIGNANT : accès autorisé à tout profil d'étudiant
 * - ETUDIANT : accès UNIQUEMENT à son propre id. Si id différent -> 403 Forbidden (prévention IDOR)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireRole();
  if (!auth.success) {
    return auth.response;
  }

  const { id } = await context.params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return NextResponse.json({ error: "Identifiant étudiant invalide" }, { status: 400 });
  }

  // Vérification IDOR : un étudiant ne peut pas consulter le profil d'un autre
  if (auth.user.role === "ETUDIANT" && auth.user.id !== targetId) {
    return NextResponse.json(
      {
        error:
          "Accès refusé (403 Forbidden) : vous ne pouvez consulter que vos propres données d'étudiant.",
      },
      { status: 403 }
    );
  }

  const student = await prisma.user.findFirst({
    where: { id: targetId, role: "ETUDIANT" },
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

  if (!student) {
    return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });
  }

  return NextResponse.json(student);
}

/**
 * PATCH /api/students/[id]
 * - Non connecté : 401 Unauthorized
 * - ETUDIANT : 403 Forbidden
 * - ADMIN : modification libre (nom, email, filiere, note)
 * - ENSEIGNANT : modification RESTREINTE aux informations pédagogiques (filiere, note)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  // Les rôles autorisés à modifier sont ADMIN et ENSEIGNANT
  const auth = await requireRole(["ADMIN", "ENSEIGNANT"]);
  if (!auth.success) {
    return auth.response;
  }

  const { id } = await context.params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return NextResponse.json({ error: "Identifiant étudiant invalide" }, { status: 400 });
  }

  const existingStudent = await prisma.user.findFirst({
    where: { id: targetId, role: "ETUDIANT" },
  });

  if (!existingStudent) {
    return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });
  }

  try {
    const body = await request.json();

    if (auth.user.role === "ENSEIGNANT") {
      // Vérifier que l'enseignant ne tente pas de modifier des données administratives
      const forbiddenFields = ["name", "email", "password", "passwordHash", "role", "id"];
      const hasForbiddenFields = Object.keys(body).some((key) =>
        forbiddenFields.includes(key)
      );

      if (hasForbiddenFields) {
        return NextResponse.json(
          {
            error:
              "Accès refusé (403 Forbidden) : les enseignants ne peuvent modifier que les informations pédagogiques (filière et note).",
          },
          { status: 403 }
        );
      }

      const parsed = TeacherUpdateStudentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Données pédagogiques invalides",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.user.update({
        where: { id: targetId },
        data: {
          ...(parsed.data.filiere !== undefined && { filiere: parsed.data.filiere }),
          ...(parsed.data.note !== undefined && { note: parsed.data.note }),
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

      return NextResponse.json(updated);
    }

    // Cas ADMIN : modification complète autorisée
    const parsed = AdminUpdateStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Vérifier unicité email si l'email est modifié
    if (parsed.data.email && parsed.data.email !== existingStudent.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });
      if (emailConflict) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé par un autre compte" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email }),
        ...(parsed.data.filiere !== undefined && { filiere: parsed.data.filiere }),
        ...(parsed.data.note !== undefined && { note: parsed.data.note }),
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

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students/[id]
 * - Non connecté : 401 Unauthorized
 * - ENSEIGNANT / ETUDIANT : 403 Forbidden
 * - ADMIN : suppression autorisée
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.success) {
    return auth.response;
  }

  const { id } = await context.params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return NextResponse.json({ error: "Identifiant étudiant invalide" }, { status: 400 });
  }

  const existingStudent = await prisma.user.findFirst({
    where: { id: targetId, role: "ETUDIANT" },
  });

  if (!existingStudent) {
    return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });
  }

  await prisma.user.delete({
    where: { id: targetId },
  });

  return NextResponse.json({
    message: "Étudiant supprimé avec succès",
    id: targetId,
  });
}
