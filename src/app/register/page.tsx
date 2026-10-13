import { register } from "./actions";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-bold">Inscription</h1>
        <form action={register} className="flex flex-col gap-3">
          <input
            name="name"
            placeholder="Nom"
            required
            className="rounded border border-gray-300 p-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded border border-gray-300 p-2 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            required
            className="rounded border border-gray-300 p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 p-2 text-white hover:bg-blue-700 font-medium text-sm mt-2"
          >
            Créer le compte
          </button>
        </form>
      </div>
    </div>
  );
}
