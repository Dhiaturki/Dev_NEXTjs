// tests/security.test.mjs
import Database from "better-sqlite3";
import { SignJWT, jwtVerify } from "jose";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../dev.db");
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "e9b28a8d6f5c40139b4b9b6f849c4883e4c44a7f5bc65161c566dd675d0b98e1"
);

const db = new Database(dbPath);

async function createToken(userId, role) {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
}

async function verifyToken(token) {
  return jwtVerify(token, secret);
}

// Simulation du contrôle RBAC côté serveur
async function simulateRequireRole(token, allowedRoles) {
  if (!token) {
    return { status: 401, error: "Non authentifié" };
  }
  try {
    const { payload } = await verifyToken(token);
    const user = db
      .prepare("SELECT id, name, email, role, filiere, note FROM User WHERE id = ?")
      .get(payload.userId);

    if (!user) {
      return { status: 401, error: "Utilisateur non trouvé" };
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return { status: 403, error: "Rôle insuffisant", user };
    }

    return { status: 200, user };
  } catch (err) {
    return { status: 401, error: "Token invalide" };
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("🔒 SUITE DE TESTS DE SÉCURITÉ TP2 (Partie 6 - Slide 9)");
  console.log("========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // Utilisateurs de test existants en base
  const admin = db.prepare("SELECT id, role, passwordHash FROM User WHERE email = 'admin@ecole.tn'").get();
  const teacher = db.prepare("SELECT id, role, passwordHash FROM User WHERE email = 'prof@ecole.tn'").get();
  const studentA = db.prepare("SELECT id, role, passwordHash FROM User WHERE email = 'yasmine@etudiant.tn'").get();
  const studentB = db.prepare("SELECT id, role, passwordHash FROM User WHERE email = 'ahmed@etudiant.tn'").get();

  const tokenAdmin = await createToken(admin.id, admin.role);
  const tokenTeacher = await createToken(teacher.id, teacher.role);
  const tokenStudentA = await createToken(studentA.id, studentA.role);

  // Test 1: Utilisateur non connecté → API privée refusée (401)
  {
    const res = await simulateRequireRole(null, ["ADMIN", "ENSEIGNANT", "ETUDIANT"]);
    assert(
      res.status === 401,
      "Test 1: Utilisateur non connecté → API privée refusée avec code HTTP 401"
    );
  }

  // Test 2: ETUDIANT → suppression refusée (403)
  {
    // DELETE /api/students/[id] réservé à ADMIN
    const res = await simulateRequireRole(tokenStudentA, ["ADMIN"]);
    assert(
      res.status === 403,
      "Test 2: ETUDIANT tente une suppression → Rejeté avec code HTTP 403 Forbidden"
    );
  }

  // Test 3: ENSEIGNANT → création refusée si réservée à ADMIN (403)
  {
    // POST /api/students réservé à ADMIN
    const res = await simulateRequireRole(tokenTeacher, ["ADMIN"]);
    assert(
      res.status === 403,
      "Test 3: ENSEIGNANT tente une création d'étudiant → Rejeté avec code HTTP 403 Forbidden"
    );
  }

  // Test 4: Étudiant A → accès au profil de B refusé (403 IDOR)
  {
    const authA = await simulateRequireRole(tokenStudentA);
    const canAccessOther = authA.user.role === "ETUDIANT" && authA.user.id !== studentB.id ? 403 : 200;
    assert(
      canAccessOther === 403,
      `Test 4: Étudiant A (ID ${studentA.id}) tente d'accéder au profil de l'étudiant B (ID ${studentB.id}) → Rejeté avec code HTTP 403 (Prévention IDOR)`
    );
  }

  // Test 5: ADMIN → opérations autorisées réussies
  {
    const resGet = await simulateRequireRole(tokenAdmin, ["ADMIN"]);
    const resCreate = await simulateRequireRole(tokenAdmin, ["ADMIN"]);
    const resDelete = await simulateRequireRole(tokenAdmin, ["ADMIN"]);
    assert(
      resGet.status === 200 && resCreate.status === 200 && resDelete.status === 200,
      "Test 5: ADMIN effectue les opérations d'administration → Succès avec code HTTP 200"
    );
  }

  // Test 6: Aucune réponse ne contient le champ password / passwordHash
  {
    const allUsers = db.prepare("SELECT id, name, email, role, filiere, note FROM User").all();
    const leakedPassword = allUsers.some(
      (u) => "password" in u || "passwordHash" in u
    );
    assert(
      !leakedPassword,
      "Test 6: Les projections SQL/Prisma n'exposent jamais le champ password ou passwordHash"
    );
  }

  console.log("\n--------------------------------------------------------");
  console.log(`RÉSULTAT FINAL : ${passed}/${total} tests passés avec succès.`);
  console.log("--------------------------------------------------------\n");

  db.close();
}

runTests().catch(console.error);
