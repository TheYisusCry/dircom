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
