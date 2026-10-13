"use client";

import React, { useState, useEffect } from "react";
import { logout, quickLoginAs } from "@/app/dashboard/actions";

interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
  filiere: string | null;
  note: number | null;
  createdAt: string;
}

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  filiere: string | null;
  note: number | null;
}

export default function DashboardClient({ user }: { user: CurrentUser }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulaire d'ajout (ADMIN)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    password: "",
    filiere: "Génie Logiciel",
    note: 15,
  });

  // Formulaire de modification
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    filiere: "",
    note: 0,
  });

  // Console de test de sécurité
  const [securityTestResult, setSecurityTestResult] = useState<{
    testName: string;
    status: number;
    data: any;
    success: boolean;
  } | null>(null);
  const [testingSecurity, setTestingSecurity] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [user.id, user.role]);

  async function fetchStudents() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(`Erreur ${res.status}: ${data.error || "Impossible de charger les étudiants"}`);
      } else {
        setStudents(data);
      }
    } catch (err: any) {
      setErrorMessage("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenEdit(student: Student) {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      email: student.email,
      filiere: student.filiere || "",
      note: student.note !== null ? student.note : 10,
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    // Pour l'enseignant, n'envoyer que filiere et note
    const payload =
      user.role === "ENSEIGNANT"
        ? {
            filiere: editFormData.filiere,
            note: Number(editFormData.note),
          }
        : {
            name: editFormData.name,
            email: editFormData.email,
            filiere: editFormData.filiere,
            note: Number(editFormData.note),
          };

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(`Erreur ${res.status}: ${data.error || "Échec de modification"}`);
      } else {
        setSuccessMessage(`Étudiant #${editingStudent.id} mis à jour avec succès !`);
        setEditingStudent(null);
        fetchStudents();
      }
    } catch {
      setErrorMessage("Erreur réseau lors de la mise à jour");
    }
  }

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStudent,
          note: Number(newStudent.note),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(`Erreur ${res.status}: ${data.error || "Échec de création"}`);
      } else {
        setSuccessMessage(`Étudiant créé avec succès (${data.name}) !`);
        setShowAddModal(false);
        setNewStudent({
          name: "",
          email: "",
          password: "",
          filiere: "Génie Logiciel",
          note: 15,
        });
        fetchStudents();
      }
    } catch {
      setErrorMessage("Erreur réseau lors de la création");
    }
  }

  async function handleDeleteStudent(id: number) {
    if (!confirm(`Confirmer la suppression de l'étudiant #${id} ?`)) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(`Erreur ${res.status}: ${data.error || "Échec de suppression"}`);
      } else {
        setSuccessMessage(`Étudiant #${id} supprimé.`);
        fetchStudents();
      }
    } catch {
      setErrorMessage("Erreur réseau lors de la suppression");
    }
  }

  // Simulations de tests de sécurité (Partie 6 du TP)
  async function runSecurityTest(testId: string) {
    setTestingSecurity(true);
    setSecurityTestResult(null);
    setErrorMessage(null);

    try {
      if (testId === "unauthenticated") {
        // Test 1: Requête sans cookie de session
        const res = await fetch("/api/profile", {
          headers: { Cookie: "" },
        });
        const data = await res.json();
        setSecurityTestResult({
          testName: "1. Utilisateur non connecté → API privée refusée",
          status: res.status,
          data,
          success: res.status === 401,
        });
      } else if (testId === "student_delete") {
        // Test 2: Tentative de suppression par un étudiant (ou forcer DELETE)
        const targetId = students[0]?.id || 3;
        const res = await fetch(`/api/students/${targetId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        setSecurityTestResult({
          testName: "2. ETUDIANT/ENSEIGNANT → suppression refusée",
          status: res.status,
          data,
          success: user.role === "ADMIN" ? res.status === 200 : res.status === 403,
        });
      } else if (testId === "teacher_create") {
        // Test 3: Tentative de création par un enseignant
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Hacker Test",
            email: `hacker_${Date.now()}@ecole.tn`,
            password: "password123",
            filiere: "Test",
          }),
        });
        const data = await res.json();
        setSecurityTestResult({
          testName: "3. ENSEIGNANT → création refusée",
          status: res.status,
          data,
          success: user.role === "ADMIN" ? res.status === 201 : res.status === 403,
        });
      } else if (testId === "idor_test") {
        // Test 4: Étudiant A accède au profil de B
        const otherId = user.id === 3 ? 4 : 3;
        const res = await fetch(`/api/students/${otherId}`);
        const data = await res.json();
        setSecurityTestResult({
          testName: `4. Étudiant (ID ${user.id}) tente d'accéder au profil de l'étudiant ID ${otherId} (IDOR)`,
          status: res.status,
          data,
          success: user.role === "ETUDIANT" ? res.status === 403 : res.status === 200,
        });
      } else if (testId === "verify_no_password") {
        // Test 5: Vérifier qu'aucune réponse ne contient password / passwordHash
        const res = await fetch("/api/students");
        const data = await res.json();
        const jsonString = JSON.stringify(data);
        const containsPassword =
          jsonString.includes("password") || jsonString.includes("passwordHash");
        setSecurityTestResult({
          testName: "5. Vérification d'absence de mot de passe dans les réponses",
          status: res.status,
          data: {
            contientPasswordHash: containsPassword,
            message: containsPassword
              ? "VULNÉRABILITÉ : hash de mot de passe exposé !"
              : "CONFORME : Aucun mot de passe ou hash n'est exposé.",
          },
          success: !containsPassword,
        });
      }
    } catch (err: any) {
      setErrorMessage(`Erreur d'exécution du test: ${err.message}`);
    } finally {
      setTestingSecurity(false);
    }
  }

  // Badges de rôles
  const roleBadgeColor = {
    ADMIN: "bg-red-100 text-red-800 border-red-300",
    ENSEIGNANT: "bg-indigo-100 text-indigo-800 border-indigo-300",
    ETUDIANT: "bg-emerald-100 text-emerald-800 border-emerald-300",
  }[user.role] || "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <div className="space-y-6">
      {/* En-tête Utilisateur & Rôle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Bonjour, {user.name}
              </h1>
              <span
                className={`text-xs px-3 py-1 font-semibold rounded-full border ${roleBadgeColor}`}
              >
                Rôle : {user.role}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Connecté avec : <span className="font-mono">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-sm font-medium transition"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        {/* Barre de changement rapide de rôle pour le TP */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Changer de profil pour tester les permissions (TP2) :
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => quickLoginAs("ADMIN")}
              className={`text-xs px-3 py-1.5 rounded font-medium transition border ${
                user.role === "ADMIN"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              }`}
            >
              1. Passer ADMIN (admin@ecole.tn)
            </button>
            <button
              onClick={() => quickLoginAs("ENSEIGNANT")}
              className={`text-xs px-3 py-1.5 rounded font-medium transition border ${
                user.role === "ENSEIGNANT"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
              }`}
            >
              2. Passer ENSEIGNANT (prof@ecole.tn)
            </button>
            <button
              onClick={() => quickLoginAs("ETUDIANT")}
              className={`text-xs px-3 py-1.5 rounded font-medium transition border ${
                user.role === "ETUDIANT"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              3. Passer ÉTUDIANT (yasmine@etudiant.tn)
            </button>
          </div>
        </div>
      </div>

      {/* Messages d'erreur et succès (401, 403, etc.) */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-800">Alerte de Sécurité / Erreur Serveur</h3>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r shadow-sm flex items-start justify-between">
          <p className="text-sm text-green-700 font-medium">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Résumé des droits du rôle actuel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">
          Matrice des autorisations de votre session ({user.role}) :
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-gray-500 block">Lister étudiants :</span>
            <span className="font-semibold text-emerald-600">
              {user.role === "ETUDIANT" ? "Ses données uniquement" : "✓ Autorisé"}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-gray-500 block">Créer étudiant :</span>
            <span className={`font-semibold ${user.role === "ADMIN" ? "text-emerald-600" : "text-red-600"}`}>
              {user.role === "ADMIN" ? "✓ Autorisé" : "✗ Refusé (403)"}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-gray-500 block">Modifier étudiant :</span>
            <span
              className={`font-semibold ${
                user.role === "ADMIN"
                  ? "text-emerald-600"
                  : user.role === "ENSEIGNANT"
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {user.role === "ADMIN"
                ? "✓ Total"
                : user.role === "ENSEIGNANT"
                ? "✓ Pédagogique uniquement"
                : "✗ Refusé (403)"}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-gray-500 block">Supprimer étudiant :</span>
            <span className={`font-semibold ${user.role === "ADMIN" ? "text-emerald-600" : "text-red-600"}`}>
              {user.role === "ADMIN" ? "✓ Autorisé" : "✗ Refusé (403)"}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-gray-500 block">Consulter son profil :</span>
            <span className="font-semibold text-emerald-600">✓ Autorisé</span>
          </div>
        </div>
      </div>

      {/* Section Principale selon Rôle */}
      {user.role === "ETUDIANT" ? (
        /* Vue spécifique ÉTUDIANT */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Mon Dossier Étudiant Personnel</h2>
            <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded">
              ID #{user.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <span className="text-xs text-gray-500 uppercase font-semibold">Nom complet</span>
              <p className="text-base font-bold text-gray-900 mt-1">{user.name}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <span className="text-xs text-gray-500 uppercase font-semibold">Filière d'études</span>
              <p className="text-base font-bold text-gray-900 mt-1">{user.filiere || "Non renseignée"}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-emerald-50 border-emerald-200">
              <span className="text-xs text-emerald-700 uppercase font-semibold">Note / Moyenne</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {user.note !== null ? `${user.note} / 20` : "En attente"}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800 mt-4">
            <p className="font-bold">🔒 Sécurité & Contrôle d'accès :</p>
            <p className="mt-1">
              Votre compte est restreint à la consultation de vos propres données.
              Toute tentative d'accéder au dossier d'un camarade renvoie une réponse
              HTTP <strong>403 Forbidden</strong> via le Route Handler.
            </p>
          </div>
        </div>
      ) : (
        /* Vue ADMIN ou ENSEIGNANT */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Liste des Étudiants ({students.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {user.role === "ADMIN"
                  ? "Gestion complète : création, édition et suppression"
                  : "Accès enseignant : consultation et mise à jour pédagogique (filière, note)"}
              </p>
            </div>

            {user.role === "ADMIN" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition"
              >
                + Nouvel Étudiant
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Chargement des données...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Aucun étudiant trouvé.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Filière</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs">{student.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{student.email}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">
                          {student.filiere || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {student.note !== null ? `${student.note} / 20` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded font-medium transition"
                        >
                          {user.role === "ADMIN" ? "Modifier" : "Noter / Filière"}
                        </button>
                        {user.role === "ADMIN" ? (
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded font-medium transition"
                          >
                            Supprimer
                          </button>
                        ) : (
                          <span
                            title="Action réservée à l'administrateur"
                            className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded cursor-not-allowed"
                          >
                            Suppr. interdite
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal d'ajout d'étudiant (ADMIN) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Créer un nouvel étudiant</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet</label>
                <input
                  required
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  placeholder="Ex: Mohamed Ali"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  placeholder="etudiant@ecole.tn"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mot de passe temporaire</label>
                <input
                  required
                  type="password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Filière</label>
                  <input
                    type="text"
                    value={newStudent.filiere}
                    onChange={(e) => setNewStudent({ ...newStudent, filiere: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Note initiale</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={newStudent.note}
                    onChange={(e) => setNewStudent({ ...newStudent, note: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Créer l'étudiant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Modifier l'étudiant #{editingStudent.id}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {user.role === "ENSEIGNANT"
                ? "Vos permissions sont restreintes aux informations pédagogiques (filière, note)."
                : "Droits d'administration complets."}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              {user.role === "ADMIN" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nom</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Filière</label>
                <input
                  type="text"
                  required
                  value={editFormData.filiere}
                  onChange={(e) => setEditFormData({ ...editFormData, filiere: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Note (/20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  required
                  value={editFormData.note}
                  onChange={(e) => setEditFormData({ ...editFormData, note: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Console de Tests de Sécurité (Partie 6 du TP) */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              🛡️ Console de Tests de Sécurité (Partie 6 du TP)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exécutez les attaques et tests de validation côté serveur pour vérifier les codes HTTP 401 et 403.
            </p>
          </div>
          {testingSecurity && (
            <span className="text-xs text-amber-400 animate-pulse font-mono">Test en cours...</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => runSecurityTest("unauthenticated")}
            className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded transition"
          >
            <span className="font-semibold text-slate-200 block">1. Non Authentifié</span>
            <span className="text-[11px] text-slate-400">Doit retourner HTTP 401</span>
          </button>

          <button
            onClick={() => runSecurityTest("student_delete")}
            className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded transition"
          >
            <span className="font-semibold text-slate-200 block">2. Supprimer un étudiant</span>
            <span className="text-[11px] text-slate-400">
              {user.role === "ADMIN" ? "Succès (200)" : "Refusé HTTP 403"}
            </span>
          </button>

          <button
            onClick={() => runSecurityTest("teacher_create")}
            className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded transition"
          >
            <span className="font-semibold text-slate-200 block">3. Créer un étudiant</span>
            <span className="text-[11px] text-slate-400">
              {user.role === "ADMIN" ? "Succès (201)" : "Refusé HTTP 403"}
            </span>
          </button>

          <button
            onClick={() => runSecurityTest("idor_test")}
            className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded transition"
          >
            <span className="font-semibold text-slate-200 block">4. Test IDOR (Profil d'un tiers)</span>
            <span className="text-[11px] text-slate-400">
              {user.role === "ETUDIANT" ? "Refusé HTTP 403" : "Autorisé (200)"}
            </span>
          </button>

          <button
            onClick={() => runSecurityTest("verify_no_password")}
            className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded transition"
          >
            <span className="font-semibold text-slate-200 block">5. Vérification Password</span>
            <span className="text-[11px] text-slate-400">Aucun passwordHash dans l'API</span>
          </button>
        </div>

        {/* Affichage du résultat du test */}
        {securityTestResult && (
          <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="font-bold text-slate-300">{securityTestResult.testName}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  securityTestResult.success ? "bg-green-950 text-green-400 border border-green-800" : "bg-red-950 text-red-400 border border-red-800"
                }`}
              >
                Code HTTP: {securityTestResult.status} ({securityTestResult.success ? "TEST VALIDÉ" : "ÉCHEC"})
              </span>
            </div>
            <pre className="overflow-x-auto text-slate-300 max-h-48">
              {JSON.stringify(securityTestResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
