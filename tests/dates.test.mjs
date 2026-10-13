import test from "node:test";
import assert from "node:assert/strict";
import {
  getNextBirthday,
  formatCalendarDate,
  formatEventDate,
  formatTime,
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
