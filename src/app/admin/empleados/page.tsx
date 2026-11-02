import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmployeeManager } from "@/components/admin/employee-manager";
export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const page = /^\d+$/.test(query.page ?? "")
    ? Math.max(1, Math.min(100000, Number(query.page)))
    : 1;
  const size = 50;
  const adminClient = createAdminClient();

  const [result, activeEmployeesResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "employee")
      .order("is_active", { ascending: false })
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .range((page - 1) * size, page * size - 1),
    adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "employee")
      .eq("is_active", true),
  ]);

  if (result.error || activeEmployeesResult.error) {
    throw new Error("No se pudieron cargar los empleados.");
  }

  const activeCount = activeEmployeesResult.count ?? 0;
  const pages = Math.max(1, Math.ceil((result.count ?? 0) / size));
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Empleados</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        Crea cuentas, configura cumpleaños y administra el acceso.
      </p>
      <EmployeeManager employees={result.data ?? []} activeCount={activeCount} />
      <nav
        aria-label="Paginación de empleados"
        className="mt-6 flex items-center justify-between text-xs text-muted"
      >
        {page > 1 ? (
          <Link
            className="admin-link"
            href={`/admin/empleados?page=${page - 1}`}
          >
            ← Anterior
          </Link>
        ) : (
          <span />
        )}
        <span>
          Página {page} de {pages} · {result.count ?? 0} empleados ({activeCount} activos)
        </span>
        {page < pages ? (
          <Link
            className="admin-link"
            href={`/admin/empleados?page=${page + 1}`}
          >
            Siguiente →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
