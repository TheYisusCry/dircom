import type {
  CoffeeDeliveryRow,
  CoffeeLeaderboardEntry,
  CoffeeOfficeSummary,
  EmployeeCoffeeStatus,
} from "@/types/coffee";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export const COFFEE_SYSTEM_START_YEAR = 2026;
export const COFFEE_SYSTEM_START_MONTH = 11; // Noviembre 2026

export type EmployeeInput = {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  avatar_path: string | null;
  created_at: string;
};

/**
 * Calcula cuántos meses de café se le exigen a un empleado.
 * Los empleados creados antes o durante noviembre 2026 empiezan a contar desde noviembre 2026.
 * Empleados creados posteriormente empiezan a contar desde su mes de registro.
 */
export function getRequiredMonths(
  profileCreatedAt: string,
  currentYear: number,
  currentMonth: number,
): number {
  let createdYear = COFFEE_SYSTEM_START_YEAR;
  let createdMonth = COFFEE_SYSTEM_START_MONTH;

  if (profileCreatedAt) {
    const createdDate = new Date(profileCreatedAt);
    if (!Number.isNaN(createdDate.getTime())) {
      const y = createdDate.getUTCFullYear();
      const m = createdDate.getUTCMonth() + 1;
      // Solo tomamos la fecha de creación si es posterior a la fecha de inicio del sistema
      if (y > COFFEE_SYSTEM_START_YEAR || (y === COFFEE_SYSTEM_START_YEAR && m > COFFEE_SYSTEM_START_MONTH)) {
        createdYear = y;
        createdMonth = m;
      }
    }
  }

  const monthsDiff = (currentYear - createdYear) * 12 + (currentMonth - createdMonth) + 1;
  return Math.max(1, monthsDiff);
}

/**
 * Calcula el estado individual de un empleado respecto a su cuota de café.
 */
export function calculateEmployeeCoffeeStatus(
  employee: EmployeeInput,
  deliveries: CoffeeDeliveryRow[],
  currentYear: number,
  currentMonth: number,
): EmployeeCoffeeStatus {
  const empDeliveries = deliveries.filter((d) => d.employee_id === employee.id);
  const totalDelivered = empDeliveries.reduce((sum, d) => sum + d.quantity, 0);

  const currentPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const deliveredThisMonth = empDeliveries
    .filter((d) => d.delivery_date.startsWith(currentPrefix))
    .reduce((sum, d) => sum + d.quantity, 0);

  const sortedDates = [...empDeliveries].sort((a, b) =>
    b.delivery_date.localeCompare(a.delivery_date),
  );
  const lastDeliveryDate = sortedDates[0]?.delivery_date ?? null;

  const requiredMonths = getRequiredMonths(
    employee.created_at,
    currentYear,
    currentMonth,
  );
  const balance = totalDelivered - requiredMonths;

  let status: "in_advance" | "up_to_date" | "pending";
  if (balance > 0) {
    status = "in_advance";
  } else if (balance === 0) {
    status = "up_to_date";
  } else {
    status = "pending";
  }

  return {
    employeeId: employee.id,
    employeeName: `${employee.first_name} ${employee.last_name}`.trim(),
    jobTitle: employee.job_title,
    avatarPath: employee.avatar_path,
    requiredMonths,
    totalDelivered,
    balance,
    status,
    deliveredThisMonth,
    lastDeliveryDate,
  };
}

/**
 * Construye el ranking general y podio histórico ordenado por total de café aportado.
 */
export function buildCoffeeLeaderboard(
  statuses: EmployeeCoffeeStatus[],
  deliveries: CoffeeDeliveryRow[],
): CoffeeLeaderboardEntry[] {
  const deliveryCounts = new Map<string, number>();
  for (const d of deliveries) {
    deliveryCounts.set(d.employee_id, (deliveryCounts.get(d.employee_id) ?? 0) + 1);
  }

  const sorted = [...statuses].sort((a, b) => {
    if (b.totalDelivered !== a.totalDelivered) {
      return b.totalDelivered - a.totalDelivered;
    }
    return a.employeeName.localeCompare(b.employeeName);
  });

  return sorted.map((emp, index) => {
    let badge: string | undefined;
    if (emp.totalDelivered > 0) {
      if (index === 0) badge = "☕ Gran Cafetero";
      else if (index === 1) badge = "⭐ Patrocinador Estrella";
      else if (index === 2) badge = "🌱 Aliado del Grano";
      else badge = "Contribuidor";
    }

    return {
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      jobTitle: emp.jobTitle,
      avatarPath: emp.avatarPath,
      totalPackages: emp.totalDelivered,
      deliveriesCount: deliveryCounts.get(emp.employeeId) ?? 0,
      rank: index + 1,
      badge,
    };
  });
}

/**
 * Resumen general de la oficina para el mes en curso.
 */
export function calculateCoffeeOfficeSummary(
  statuses: EmployeeCoffeeStatus[],
  currentYear: number,
  currentMonth: number,
): CoffeeOfficeSummary {
  const totalEmployees = statuses.length;
  const upToDateCount = statuses.filter((s) => s.status !== "pending").length;
  const pendingCount = statuses.filter((s) => s.status === "pending").length;
  const officeTotalPackages = statuses.reduce((sum, s) => sum + s.totalDelivered, 0);
  const progressPercentage =
    totalEmployees > 0 ? Math.round((upToDateCount / totalEmployees) * 100) : 0;
  const monthName = MONTH_NAMES[currentMonth - 1] ?? "Mes actual";

  return {
    currentMonthLabel: `${monthName} ${currentYear}`,
    totalEmployees,
    upToDateCount,
    pendingCount,
    officeTotalPackages,
    progressPercentage,
    currentYear,
    currentMonth,
  };
}
