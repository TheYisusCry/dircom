import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { CelebrationManager, type CelebrationWithEmployee } from "@/components/admin/celebration-manager";

export const dynamic = "force-dynamic";

export default async function AdminCumpleanosPage() {
  await requireAdmin();
  const admin = createAdminClient();

  // Fetch active employees with or without birthday
  const employeesResult = await admin
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("first_name");

  if (employeesResult.error) {
    throw new Error("No se pudieron cargar los empleados.");
  }

  // Fetch all celebrations with employee details
  const celebrationsResult = await admin
    .from("birthday_celebrations")
    .select("*, employee:profiles(*)")
    .order("starts_at", { ascending: false });

  if (celebrationsResult.error) {
    throw new Error("No se pudieron cargar las celebraciones.");
  }

  // Type assertion safe because employee is joined from profiles
  const celebrations = (celebrationsResult.data ?? []) as unknown as CelebrationWithEmployee[];
  const employees = employeesResult.data ?? [];

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Cumpleaños y Celebraciones</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        Programa agasajos, invitaciones y encuentros para los cumpleaños de tu equipo.
      </p>
      <CelebrationManager celebrations={celebrations} employees={employees} />
    </>
  );
}
