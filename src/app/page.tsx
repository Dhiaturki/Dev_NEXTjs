import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-10 text-center">
        <div className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 font-bold rounded-full mb-4">
          Applications Web Avancées • Next.js
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          TP2 — Gestion des Rôles & Contrôle d'Accès
        </h1>

        <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
          Application Next.js App Router sécurisée avec <strong>Prisma ORM</strong>,{" "}
          <strong>SQLite</strong>, authentification par cookies <strong>HttpOnly</strong> et
          contrôle d'accès basé sur les rôles (<strong>RBAC</strong> côté serveur).
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-xs font-bold text-red-800 block">👑 ADMIN</span>
            <span className="text-[11px] text-red-600">
              CRUD complet sur tous les étudiants.
            </span>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <span className="text-xs font-bold text-indigo-800 block">👨‍🏫 ENSEIGNANT</span>
            <span className="text-[11px] text-indigo-600">
              Consultation & modification pédagogique (filière, note).
            </span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-xs font-bold text-emerald-800 block">🎓 ÉTUDIANT</span>
            <span className="text-[11px] text-emerald-600">
              Consultation stricte de son propre profil (anti-IDOR).
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm shadow-sm"
            >
              Accéder au Tableau de Bord ({user.name})
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm shadow-sm"
              >
                Se Connecter
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-xl transition text-sm"
              >
                Créer un Compte
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
