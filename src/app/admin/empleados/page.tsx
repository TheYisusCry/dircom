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
  const result = await createAdminClient()
    .from("profiles")
    .select("*", { count: "exact" })
    .order("role")
    .order("first_name")
    .order("last_name")
    .range((page - 1) * size, page * size - 1);
  if (result.error) throw new Error("No se pudieron cargar los empleados.");
  const pages = Math.max(1, Math.ceil((result.count ?? 0) / size));
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Empleados</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        Crea cuentas, configura cumpleaños y administra el acceso.
      </p>
      <EmployeeManager employees={result.data ?? []} />
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
          Página {page} de {pages} · {result.count ?? 0} cuentas
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
