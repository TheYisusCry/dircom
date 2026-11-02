import test from "node:test";
import assert from "node:assert/strict";
import { serverClockOffset, revelationRemaining, mergeMessages } from "../src/lib/live.ts";

test("compensa relojes adelantados y atrasados usando el punto medio de la petición", () => {
  assert.equal(serverClockOffset(1000, 5000, 5200), -4100);
  assert.equal(serverClockOffset(5000, 1000, 1200), 3900);
});
test("la revelación depende de una hora absoluta, no de cuándo llega el aviso", () => {
  const revealAt = "2026-11-02T12:00:10.000Z";
  const start = Date.parse("2026-11-02T12:00:00.000Z");
  assert.equal(revelationRemaining(revealAt, start + 2000), 8000);
  assert.equal(revelationRemaining(revealAt, start + 9000), 1000);
  assert.equal(revelationRemaining(revealAt, start + 10_001), 0);
  assert.equal(revelationRemaining(null, start), 0);
});
test("mensajes repetidos y páginas solapadas se mezclan sin duplicados y con orden estable", () => {
  const a = { id: "a", sentAt: "2026-11-02T12:00:00Z", text: "primero" };
  const b = { id: "b", sentAt: a.sentAt, text: "segundo" };
  const c = { id: "c", sentAt: "2026-11-02T12:00:01Z", text: "tercero" };
  const result = mergeMessages([b, c], [a, b, { ...c, text: "actualizado" }]);
  assert.deepEqual(result.map((m) => m.id), ["a", "b", "c"]);
  assert.equal(result[2].text, "actualizado");
});
