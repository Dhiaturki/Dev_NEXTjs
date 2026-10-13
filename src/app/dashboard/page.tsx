import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <DashboardClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            filiere: user.filiere,
            note: user.note,
          }}
        />
      </div>
    </main>
  );
}
