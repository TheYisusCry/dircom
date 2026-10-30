import type {
  BirthdayCelebration,
  BirthdayPresentation,
  Employee,
} from "@/types";

export const OFFICE_TIME_ZONE = "America/La_Paz";

export function formatCalendarDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: OFFICE_TIME_ZONE,
  }).format(new Date(date));
}

export function formatTime(date: string) {
  return new Intl.DateTimeFormat("es-BO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: OFFICE_TIME_ZONE,
  }).format(new Date(date));
}

/** February 29 birthdays recur on the next actual February 29, never an invented date. */
function nextOccurrence(employee: Employee, referenceDate: string): string {
  const { day, month } = employee.birthday;
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new RangeError("Día o mes de cumpleaños inválido");
  }
  const firstYear = Number(referenceDate.slice(0, 4));
  for (let year = firstYear; year <= firstYear + 8; year++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) continue;
    const iso = date.toISOString().slice(0, 10);
    if (iso >= referenceDate) return iso;
  }
  throw new RangeError("El cumpleaños no corresponde a una fecha válida");
}

/** Returns exactly one employee. Equal birthdays keep the source list order. */
export function getNextBirthday(
  employees: readonly Employee[],
  celebrations: readonly BirthdayCelebration[],
  referenceDate: string,
): BirthdayPresentation | undefined {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(referenceDate) ||
    !Number.isFinite(Date.parse(`${referenceDate}T12:00:00Z`)) ||
    new Date(`${referenceDate}T12:00:00Z`).toISOString().slice(0, 10) !==
      referenceDate
  ) {
    throw new RangeError("Fecha de referencia inválida");
  }
  const next = employees
    .map((employee) => ({
      employee,
      nextBirthday: nextOccurrence(employee, referenceDate),
    }))
    .sort((a, b) => a.nextBirthday.localeCompare(b.nextBirthday))[0];
  if (!next) return undefined;
  const celebration = celebrations.find(
    (event) =>
      event.employeeId === next.employee.id &&
      new Intl.DateTimeFormat("en", {
        year: "numeric",
        timeZone: OFFICE_TIME_ZONE,
      }).format(new Date(event.startsAt)) === next.nextBirthday.slice(0, 4),
  );
  return { ...next, celebration };
}

/** Resolves current date and month in the official office timezone (Bolivia). */
export function getOfficeCurrentDate(): {
  todayIso: string;
  currentMonth: number;
  currentYear: number;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: OFFICE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const todayIso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { todayIso, currentMonth: month, currentYear: year };
}

/** Filters and sorts active employees who have their birthday in the given month. */
export function getBirthdaysOfMonth(
  employees: readonly Employee[],
  month: number,
): Employee[] {
  return employees
    .filter((e) => e.birthday.month === month)
    .sort((a, b) => a.birthday.day - b.birthday.day);
}

/** Converts a database profile into the presentation Employee model. Returns null if birthday is incomplete. */
export function profileToEmployee(profile: {
  id: string;
  first_name: string;
  last_name: string;
  job_title?: string | null;
  birthday_day?: number | null;
  birthday_month?: number | null;
  avatar_path?: string | null;
}): Employee | null {
  if (
    profile.birthday_day === null ||
    profile.birthday_day === undefined ||
    profile.birthday_month === null ||
    profile.birthday_month === undefined
  ) {
    return null;
  }
  return {
    id: profile.id,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    role: profile.job_title || "Equipo DIRCOM",
    photo: profile.avatar_path ? `/api/avatars/${profile.id}` : undefined,
    birthday: {
      day: profile.birthday_day,
      month: profile.birthday_month,
    },
  };
}

/** Maps a database celebration row to the presentation BirthdayCelebration model. */
export function celebrationRowToCelebration(row: {
  id: string;
  employee_id: string;
  title: string;
  invitation: string;
  starts_at: string;
  location: string;
  image_url?: string | null;
}): BirthdayCelebration {
  return {
    id: row.id,
    employeeId: row.employee_id,
    title: row.title,
    invitation: row.invitation,
    image: row.image_url || "/images/celebration.jpg",
    startsAt: row.starts_at,
    location: row.location,
  };
}
