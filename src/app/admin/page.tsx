import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Users, LockKeyhole } from "@/components/ui/icon";
export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const counts = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "employee"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "employee")
      .eq("is_active", true),
  ]);
  if (counts.some((item) => item.error))
    throw new Error("No se pudo cargar la administración.");
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Panel administrativo
      </h1>
      <p className="mt-2 text-sm text-muted">
        Gestiona las cuentas privadas y los datos de tu equipo.
      </p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="panel p-6">
          <Users size={25} className="text-forest" />
          <p className="mt-4 text-3xl font-bold">{counts[0].count ?? 0}</p>
          <p className="mt-2 text-sm text-muted">Empleados registrados</p>
        </div>
        <div className="panel p-6">
          <LockKeyhole size={25} className="text-forest" />
          <p className="mt-4 text-3xl font-bold">{counts[1].count ?? 0}</p>
          <p className="mt-2 text-sm text-muted">
            Cuentas de empleados activas
          </p>
        </div>
      </div>
      <Link
        href="/admin/empleados"
        className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-forest px-5 py-3 text-sm font-bold text-on-forest"
      >
        Gestionar empleados →
      </Link>
    </>
  );
}
