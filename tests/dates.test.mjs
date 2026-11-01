import test from "node:test";
import assert from "node:assert/strict";
import {
  getNextBirthday,
  formatCalendarDate,
  formatEventDate,
  formatTime,
  getOfficeCurrentDate,
  getBirthdaysOfMonth,
  profileToEmployee,
  celebrationRowToCelebration,
  formatCountdown,
  MONTH_NAMES,
  profileToParticipant,
} from "../src/lib/dates.ts";

const employee = (id, day, month) => ({
  id,
  name: id,
  role: "Ejemplo",
  birthday: { day, month },
});
const event = (startsAt = "2026-10-16T17:00:00-04:00") => ({
  id: "event",
  employeeId: "Mía",
  title: "Celebración",
  invitation: "Invitación",
  location: "Oficina",
  startsAt,
});

test("elige un solo cumpleaños próximo, independientemente del orden de origen", () => {
  const result = getNextBirthday(
    [employee("Pedro", 24, 11), employee("Mía", 18, 10)],
    [],
    "2026-10-13",
  );
  assert.equal(result.employee.id, "Mía");
  assert.equal(result.nextBirthday, "2026-10-18");
});

test("incluye un cumpleaños de hoy y mantiene el orden en un empate", () => {
  const result = getNextBirthday(
    [employee("Mía", 13, 10), employee("Pedro", 13, 10)],
    [],
    "2026-10-13",
  );
  assert.equal(result.employee.id, "Mía");
  assert.equal(result.nextBirthday, "2026-10-13");
});

test("los cumpleaños pasados recurren el siguiente año", () => {
  assert.equal(
    getNextBirthday([employee("Mía", 18, 10)], [], "2026-12-31").nextBirthday,
    "2027-10-18",
  );
});

test("la celebración del 16 no cambia el cumpleaños del 18", () => {
  const result = getNextBirthday(
    [employee("Mía", 18, 10)],
    [event()],
    "2026-10-13",
  );
  assert.equal(result.nextBirthday, "2026-10-18");
  assert.equal(result.celebration.startsAt, "2026-10-16T17:00:00-04:00");
  assert.match(formatCalendarDate(result.nextBirthday), /18 de octubre/);
  assert.match(
    formatEventDate(result.celebration.startsAt),
    /16 de octubre de 2026/,
  );
  assert.match(formatTime(result.celebration.startsAt), /5:00/);
});

test("sin evento no inventa celebración; no reutiliza eventos de otros años", () => {
  const list = [employee("Mía", 18, 10)];
  assert.equal(getNextBirthday(list, [], "2026-10-13").celebration, undefined);
  assert.equal(
    getNextBirthday(list, [event("2025-10-16T17:00:00-04:00")], "2026-10-13")
      .celebration,
    undefined,
  );
});

test("resuelve el año del evento en la zona horaria de Bolivia", () => {
  const result = getNextBirthday(
    [employee("Mía", 1, 1)],
    [event("2026-01-01T01:00:00Z")],
    "2026-01-01",
  );
  assert.equal(result.celebration, undefined); // En La Paz aún es 31 de diciembre de 2025.
});

test("el 29 de febrero ocurre en el próximo año bisiesto válido", () => {
  assert.equal(
    getNextBirthday([employee("Mía", 29, 2)], [], "2026-10-13").nextBirthday,
    "2028-02-29",
  );
});

test("lista vacía y fechas inválidas tienen resultados explícitos", () => {
  assert.equal(getNextBirthday([], [], "2026-10-13"), undefined);
  assert.throws(
    () => getNextBirthday([employee("Mía", 31, 4)], [], "2026-10-13"),
    RangeError,
  );
  assert.throws(() => getNextBirthday([], [], "2026-02-30"), RangeError);
});

test("getOfficeCurrentDate devuelve fecha valida de Bolivia", () => {
  const current = getOfficeCurrentDate();
  assert.match(current.todayIso, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(current.currentMonth >= 1 && current.currentMonth <= 12);
  assert.ok(current.currentYear >= 2026);
});

test("getBirthdaysOfMonth filtra y ordena por dia", () => {
  const emps = [
    employee("Pedro", 24, 10),
    employee("Mía", 5, 10),
    employee("Lucía", 18, 3),
  ];
  const oct = getBirthdaysOfMonth(emps, 10);
  assert.equal(oct.length, 2);
  assert.equal(oct[0].id, "Mía");
  assert.equal(oct[1].id, "Pedro");
  const march = getBirthdaysOfMonth(emps, 3);
  assert.equal(march.length, 1);
  assert.equal(march[0].id, "Lucía");
});

test("profileToEmployee y celebrationRowToCelebration adaptan modelos", () => {
  assert.equal(
    profileToEmployee({
      id: "u1",
      first_name: "Test",
      last_name: "User",
      birthday_day: null,
      birthday_month: null,
    }),
    null,
  );
  const emp = profileToEmployee({
    id: "u1",
    first_name: "Test",
    last_name: "User",
    job_title: "Diseñador",
    birthday_day: 15,
    birthday_month: 6,
    avatar_path: "u1/avatar.webp",
  });
  assert.deepEqual(emp, {
    id: "u1",
    name: "Test User",
    role: "Diseñador",
    photo: "/api/avatars/u1",
    birthday: { day: 15, month: 6 },
  });
  const cel = celebrationRowToCelebration({
    id: "c1",
    employee_id: "u1",
    title: "¡Festejo!",
    invitation: "Todos invitados",
    starts_at: "2026-06-15T16:00:00-04:00",
    location: "Sala A",
    image_url: null,
  });
  assert.equal(cel.image, "/images/celebration.jpg");
  assert.equal(cel.employeeId, "u1");
});

test("formatCountdown, MONTH_NAMES y profileToParticipant", () => {
  assert.equal(MONTH_NAMES.length, 12);
  assert.equal(MONTH_NAMES[0], "Enero");
  assert.equal(MONTH_NAMES[11], "Diciembre");

  const future = new Date(Date.now() + 125_000).toISOString();
  const cd = formatCountdown(future);
  assert.equal(cd.expired, false);
  assert.match(cd.text, /^\d{2}:\d{2}$/);

  const past = new Date(Date.now() - 5_000).toISOString();
  const cdPast = formatCountdown(past);
  assert.equal(cdPast.expired, true);
  assert.equal(cdPast.text, "00:00 (Tiempo cumplido)");

  const part = profileToParticipant({
    id: "p1",
    first_name: "Juan",
    last_name: "Pérez",
    job_title: "Desarrollador",
    avatar_path: "p1/pic.webp",
  });
  assert.deepEqual(part, {
    id: "p1",
    name: "Juan Pérez",
    role: "Desarrollador",
    photo: "/api/avatars/p1",
    birthday: { day: 1, month: 1 },
  });

  const emptyPart = profileToParticipant(null);
  assert.equal(emptyPart.name, "Compañero DIRCOM");
  assert.equal(emptyPart.photo, undefined);
});
