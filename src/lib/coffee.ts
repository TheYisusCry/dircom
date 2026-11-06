import type {
  CoffeeDeliveryRow,
  CoffeeLeaderboardEntry,
  CoffeeOfficeSummary,
  EmployeeCoffeeStatus,
} from "@/types/coffee";

export const COFFEE_SYSTEM_START_YEAR = 2026;
export const COFFEE_SYSTEM_START_MONTH = 11; // Noviembre 2026

type EmployeeInput = {
  id: string;
  first_name: string;
  last_name: string;
  job_title?: string | null;
  avatar_path?: string | null;
  created_at?: string;
};

export type EmployeeDeliveryAggregate = {
  totalDelivered: number;
  deliveredThisMonth: number;
  lastDeliveryDate: string | null;
  deliveriesCount: number;
};

/**
 * Determina cuántos meses de café se le exigen a un empleado.
 * Si el empleado ingresó antes o durante el mes de inicio del sistema (Nov 2026),
 * se le exige desde Noviembre 2026.
 * Si ingresó en un mes posterior, se le exige desde su mes de ingreso.
 */
export function getRequiredMonths(
  createdAtString: string | undefined,
  currentYear: number,
  currentMonth: number,
): number {
  let createdYear = COFFEE_SYSTEM_START_YEAR;
  let createdMonth = COFFEE_SYSTEM_START_MONTH;

  if (createdAtString) {
    const createdDate = new Date(createdAtString);
    if (!Number.isNaN(createdDate.getTime())) {
      const y = createdDate.getUTCFullYear();
      const m = createdDate.getUTCMonth() + 1;
      // Solo tomamos la fecha de creación si es posterior a la fecha de inicio del sistema
      if (
        y > COFFEE_SYSTEM_START_YEAR ||
        (y === COFFEE_SYSTEM_START_YEAR && m > COFFEE_SYSTEM_START_MONTH)
      ) {
        createdYear = y;
        createdMonth = m;
      }
    }
  }

  const monthsDiff =
    (currentYear - createdYear) * 12 + (currentMonth - createdMonth) + 1;
  return Math.max(1, monthsDiff);
}

/**
 * Agrupa todas las entregas por empleado en un único pase O(D).
 */
export function indexCoffeeDeliveries(
  deliveries: Array<
    Pick<CoffeeDeliveryRow, "employee_id" | "quantity" | "delivery_date">
  >,
  currentYear: number,
  currentMonth: number,
): Map<string, EmployeeDeliveryAggregate> {
  const map = new Map<string, EmployeeDeliveryAggregate>();
  const currentPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  for (const d of deliveries) {
    let agg = map.get(d.employee_id);
    if (!agg) {
      agg = {
        totalDelivered: 0,
        deliveredThisMonth: 0,
        lastDeliveryDate: null,
        deliveriesCount: 0,
      };
      map.set(d.employee_id, agg);
    }

    agg.totalDelivered += d.quantity;
    agg.deliveriesCount += 1;

    if (d.delivery_date.startsWith(currentPrefix)) {
      agg.deliveredThisMonth += d.quantity;
    }

    if (!agg.lastDeliveryDate || d.delivery_date > agg.lastDeliveryDate) {
      agg.lastDeliveryDate = d.delivery_date;
    }
  }

  return map;
}

/**
 * Calcula el estado individual de un empleado respecto a su cuota de café.
 * Acepta el array de entregas o el acumulado pre-agrupado para evaluación O(1).
 */
export function calculateEmployeeCoffeeStatus(
  employee: EmployeeInput,
  deliveriesOrAgg:
    | Array<Pick<CoffeeDeliveryRow, "employee_id" | "quantity" | "delivery_date">>
    | EmployeeDeliveryAggregate,
  currentYear: number,
  currentMonth: number,
): EmployeeCoffeeStatus {
  let totalDelivered = 0;
  let deliveredThisMonth = 0;
  let lastDeliveryDate: string | null = null;

  if (Array.isArray(deliveriesOrAgg)) {
    const currentPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    for (const d of deliveriesOrAgg) {
      if (d.employee_id !== employee.id) continue;
      totalDelivered += d.quantity;
      if (d.delivery_date.startsWith(currentPrefix)) {
        deliveredThisMonth += d.quantity;
      }
      if (!lastDeliveryDate || d.delivery_date > lastDeliveryDate) {
        lastDeliveryDate = d.delivery_date;
      }
    }
  } else {
    totalDelivered = deliveriesOrAgg.totalDelivered;
    deliveredThisMonth = deliveriesOrAgg.deliveredThisMonth;
    lastDeliveryDate = deliveriesOrAgg.lastDeliveryDate;
  }

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
    jobTitle: employee.job_title ?? null,
    avatarPath: employee.avatar_path ?? null,
    requiredMonths,
    totalDelivered,
    balance,
    status,
    deliveredThisMonth,
    lastDeliveryDate,
  };
}

/**
 * Calcula en lote los estados de todos los empleados en una sola pasada O(E + D).
 */
export function calculateAllEmployeeCoffeeStatuses(
  employees: EmployeeInput[],
  deliveries: Array<
    Pick<CoffeeDeliveryRow, "employee_id" | "quantity" | "delivery_date">
  >,
  currentYear: number,
  currentMonth: number,
): EmployeeCoffeeStatus[] {
  const index = indexCoffeeDeliveries(deliveries, currentYear, currentMonth);
  return employees.map((emp) => {
    const agg = index.get(emp.id) ?? {
      totalDelivered: 0,
      deliveredThisMonth: 0,
      lastDeliveryDate: null,
      deliveriesCount: 0,
    };
    return calculateEmployeeCoffeeStatus(emp, agg, currentYear, currentMonth);
  });
}

/**
 * Construye el ranking general y podio histórico ordenado por total de café aportado.
 */
export function buildCoffeeLeaderboard(
  statuses: EmployeeCoffeeStatus[],
  deliveriesOrCounts:
    | Array<Pick<CoffeeDeliveryRow, "employee_id">>
    | Map<string, { deliveriesCount: number }>,
): CoffeeLeaderboardEntry[] {
  const deliveryCounts = new Map<string, number>();

  if (deliveriesOrCounts instanceof Map) {
    for (const [empId, agg] of deliveriesOrCounts) {
      deliveryCounts.set(empId, agg.deliveriesCount);
    }
  } else {
    for (const d of deliveriesOrCounts) {
      deliveryCounts.set(
        d.employee_id,
        (deliveryCounts.get(d.employee_id) ?? 0) + 1,
      );
    }
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
 * Resume el estado general de la oficina para el mes en curso.
 */
export function calculateCoffeeOfficeSummary(
  statuses: EmployeeCoffeeStatus[],
  currentYear: number,
  currentMonth: number,
): CoffeeOfficeSummary {
  const monthNames = [
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
  ];
  const currentMonthLabel = `${monthNames[currentMonth - 1] ?? ""} ${currentYear}`;

  const totalEmployees = statuses.length;
  const upToDateCount = statuses.filter((s) => s.status !== "pending").length;
  const pendingCount = statuses.filter((s) => s.status === "pending").length;

  const officeTotalPackages = statuses.reduce(
    (sum, s) => sum + s.totalDelivered,
    0,
  );
  const progressPercentage =
    totalEmployees > 0
      ? Math.round((upToDateCount / totalEmployees) * 100)
      : 0;

  return {
    currentMonthLabel,
    totalEmployees,
    upToDateCount,
    pendingCount,
    officeTotalPackages,
    progressPercentage,
    currentYear,
    currentMonth,
  };
}
