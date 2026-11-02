import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { CoffeeAdminManager } from "@/components/admin/coffee-admin-manager";
import {
  calculateCoffeeOfficeSummary,
  calculateEmployeeCoffeeStatus,
} from "@/lib/coffee";
import { getOfficeCurrentDate } from "@/lib/dates";
import type { CoffeeDeliveryWithEmployee, CoffeeDeliveryRow } from "@/types/coffee";

export const dynamic = "force-dynamic";

export default async function AdminCafePage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { todayIso, currentYear, currentMonth } = getOfficeCurrentDate();

  // 1. Obtener empleados activos
  const empRes = await admin
    .from("profiles")
    .select("id, first_name, last_name, job_title, avatar_path, created_at")
    .eq("role", "employee")
    .eq("is_active", true)
    .order("first_name", { ascending: true });

  const rawEmployees = empRes.data ?? [];

  // 2. Obtener entregas registradas
  const deliveriesRes = await admin
    .from("coffee_deliveries")
    .select(`
      id,
      employee_id,
      quantity,
      delivery_date,
      note,
      registered_by,
      created_at,
      employee:profiles!coffee_deliveries_employee_id_fkey(
        id,
        first_name,
        last_name,
        avatar_path,
        job_title
      )
    `)
    .order("delivery_date", { ascending: false })
    .order("created_at", { ascending: false });

  const rawDeliveries = (deliveriesRes.data ?? []) as unknown as CoffeeDeliveryWithEmployee[];

  const deliveryRows: CoffeeDeliveryRow[] = rawDeliveries.map((d) => ({
    id: d.id,
    employee_id: d.employee_id,
    quantity: d.quantity,
    delivery_date: d.delivery_date,
    note: d.note,
    registered_by: d.registered_by,
    created_at: d.created_at,
  }));

  // 3. Calcular estados individuales y resumen
  const statuses = rawEmployees.map((emp) =>
    calculateEmployeeCoffeeStatus(emp, deliveryRows, currentYear, currentMonth),
  );

  const summary = calculateCoffeeOfficeSummary(statuses, currentYear, currentMonth);

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Registro y Control de Café</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        Gestiona la cuota mensual de café de la oficina, registra aportes y revisa los adelantos y deudas del equipo.
      </p>
      <CoffeeAdminManager
        statuses={statuses}
        recentDeliveries={rawDeliveries.slice(0, 20)}
        summary={summary}
        todayIso={todayIso}
      />
    </>
  );
}
