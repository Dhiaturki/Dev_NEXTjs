import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères").max(80),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const CreateStudentSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères").max(80),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
  filiere: z.string().min(1).max(50).default("Informatique"),
  note: z.number().min(0).max(20).optional().nullable(),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const AdminUpdateStudentSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  filiere: z.string().min(1).max(50).optional(),
  note: z.number().min(0).max(20).optional().nullable(),
});

export type AdminUpdateStudentInput = z.infer<typeof AdminUpdateStudentSchema>;

export const TeacherUpdateStudentSchema = z.object({
  filiere: z.string().min(1).max(50).optional(),
  note: z.number().min(0).max(20).optional().nullable(),
});

export type TeacherUpdateStudentInput = z.infer<typeof TeacherUpdateStudentSchema>;
