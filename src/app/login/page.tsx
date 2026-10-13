import Link from "next/link";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Connexion</h1>
        <p className="text-xs text-gray-500 mb-5">
          TP2 — Gestion des rôles et contrôle d'accès
        </p>

        <form action={login} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Ex: admin@ecole.tn"
              required
              className="w-full rounded border border-gray-300 p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mot de passe</label>
            <input
              name="password"
              type="password"
              placeholder="Mot de passe"
              required
              className="w-full rounded border border-gray-300 p-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-blue-600 p-2.5 text-white hover:bg-blue-700 font-semibold text-sm mt-2 transition"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-600">
          <p className="font-semibold mb-2">Comptes de test (TP2) :</p>
          <ul className="space-y-1 font-mono text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-200">
            <li>👑 <strong>ADMIN:</strong> admin@ecole.tn / admin1234</li>
            <li>👨‍🏫 <strong>ENSEIGNANT:</strong> prof@ecole.tn / prof1234</li>
            <li>🎓 <strong>ETUDIANT:</strong> yasmine@etudiant.tn / etudiant1234</li>
          </ul>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            S'inscrire (Rôle Étudiant par défaut)
          </Link>
        </div>
      </div>
    </div>
  );
}
