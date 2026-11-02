import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Users, LockKeyhole, PartyPopper, Vote, Coffee } from "@/components/ui/icon";

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
    admin
      .from("birthday_celebrations")
      .select("id", { count: "exact", head: true }),
    admin
      .from("coffee_deliveries")
      .select("quantity"),
  ]);

  if (counts.some((item) => item.error))
    throw new Error("No se pudo cargar la administración.");

  const totalCoffeePackages =
    counts[3].data?.reduce((sum, d) => sum + (d.quantity ?? 1), 0) ?? 0;

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Panel administrativo
      </h1>
      <p className="mt-2 text-sm text-muted">
        Gestiona las cuentas privadas y los datos de tu equipo.
      </p>

      {/* KPI Cards */}
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="panel p-6">
          <PartyPopper size={25} className="text-forest" />
          <p className="mt-4 text-3xl font-bold">{counts[2].count ?? 0}</p>
          <p className="mt-2 text-sm text-muted">
            Celebraciones programadas
          </p>
        </div>
        <div className="panel p-6">
          <Coffee size={25} className="text-forest" />
          <p className="mt-4 text-3xl font-bold">{totalCoffeePackages}</p>
          <p className="mt-2 text-sm text-muted">
            Paquetes de café aportados
          </p>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/empleados"
          className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-forest px-6 py-4 text-center text-base font-bold text-on-forest shadow-xs transition-all hover:bg-forest-light hover:shadow-md"
        >
          <Users size={22} aria-hidden="true" />
          <span>Gestionar empleados</span>
        </Link>
        <Link
          href="/admin/cumpleanos"
          className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-line bg-white px-6 py-4 text-center text-base font-bold text-ink shadow-xs transition-all hover:border-forest/40 hover:bg-mist hover:text-forest-ink hover:shadow-md"
        >
          <PartyPopper size={22} aria-hidden="true" />
          <span>Gestionar cumpleaños</span>
        </Link>
        <Link
          href="/admin/votaciones"
          className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-line bg-white px-6 py-4 text-center text-base font-bold text-ink shadow-xs transition-all hover:border-forest/40 hover:bg-mist hover:text-forest-ink hover:shadow-md"
        >
          <Vote size={22} aria-hidden="true" />
          <span>Votaciones de la semana</span>
        </Link>
        <Link
          href="/admin/cafe"
          className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-line bg-white px-6 py-4 text-center text-base font-bold text-ink shadow-xs transition-all hover:border-forest/40 hover:bg-mist hover:text-forest-ink hover:shadow-md"
        >
          <Coffee size={22} aria-hidden="true" />
          <span>Control de café</span>
        </Link>
      </div>
    </>
  );
}
