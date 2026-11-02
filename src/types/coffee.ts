export type CoffeeDeliveryRow = {
  id: string;
  employee_id: string;
  quantity: number;
  delivery_date: string;
  note: string | null;
  registered_by: string;
  created_at: string;
};

export type CoffeeDeliveryWithEmployee = CoffeeDeliveryRow & {
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_path: string | null;
    job_title: string | null;
  } | null;
};

export type CoffeeStatusKind = "in_advance" | "up_to_date" | "pending";

export type EmployeeCoffeeStatus = {
  employeeId: string;
  employeeName: string;
  jobTitle: string | null;
  avatarPath: string | null;
  requiredMonths: number;
  totalDelivered: number;
  balance: number;
  status: CoffeeStatusKind;
  deliveredThisMonth: number;
  lastDeliveryDate: string | null;
};

export type CoffeeLeaderboardEntry = {
  employeeId: string;
  employeeName: string;
  jobTitle: string | null;
  avatarPath: string | null;
  totalPackages: number;
  deliveriesCount: number;
  rank: number;
  badge?: string;
};

export type CoffeeOfficeSummary = {
  currentMonthLabel: string;
  totalEmployees: number;
  upToDateCount: number;
  pendingCount: number;
  officeTotalPackages: number;
  progressPercentage: number;
  currentYear: number;
  currentMonth: number;
};
