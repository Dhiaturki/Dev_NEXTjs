// prisma/seed.mjs
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../dev.db");

console.log(`🌱 Connexion à la base de données : ${dbPath}`);
const db = new Database(dbPath);

const users = [
  {
    name: "Administrateur Système",
    email: "admin@ecole.tn",
    password: "admin1234",
    role: "ADMIN",
    filiere: "Administration",
    note: null,
  },
  {
    name: "Dr. Karim Mahjoub",
    email: "prof@ecole.tn",
    password: "prof1234",
    role: "ENSEIGNANT",
    filiere: "Informatique",
    note: null,
  },
  {
    name: "Yasmine Ben Ali",
    email: "yasmine@etudiant.tn",
    password: "etudiant1234",
    role: "ETUDIANT",
    filiere: "Génie Logiciel",
    note: 16.5,
  },
  {
    name: "Ahmed Trabelsi",
    email: "ahmed@etudiant.tn",
    password: "etudiant1234",
    role: "ETUDIANT",
    filiere: "Génie Logiciel",
    note: 14.0,
  },
  {
    name: "Sarra Mansour",
    email: "sarra@etudiant.tn",
    password: "etudiant1234",
    role: "ETUDIANT",
    filiere: "Réseaux & Sécurité",
    note: 17.25,
  },
];

async function seed() {
  const checkStmt = db.prepare("SELECT id FROM User WHERE email = ?");
  const updateStmt = db.prepare(`
    UPDATE User 
    SET name = ?, role = ?, filiere = ?, note = ?, passwordHash = ?
    WHERE email = ?
  `);
  const insertStmt = db.prepare(`
    INSERT INTO User (name, email, passwordHash, role, filiere, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const existing = checkStmt.get(u.email);

    if (existing) {
      updateStmt.run(u.name, u.role, u.filiere, u.note, passwordHash, u.email);
      console.log(`🔄 Mis à jour : [${u.role}] ${u.name} (${u.email})`);
    } else {
      insertStmt.run(u.name, u.email, passwordHash, u.role, u.filiere, u.note);
      console.log(`➕ Créé : [${u.role}] ${u.name} (${u.email})`);
    }
  }

  console.log("✅ Seeding terminé avec succès !");
  db.close();
}

seed().catch((err) => {
  console.error("Erreur de seeding :", err);
  process.exit(1);
});
