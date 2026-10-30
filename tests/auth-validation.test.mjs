import test from "node:test";
import assert from "node:assert/strict";
import {
  validateUsername,
  validatePassword,
  validateProfileFields,
  validBirthday,
} from "../src/lib/auth/validation.ts";
import {
  provisionAccount,
  ProvisionFailure,
} from "../src/lib/auth/provision.ts";

test("usuario normalizado, ASCII, longitud y rechazo de formatos inseguros", () => {
  assert.equal(validateUsername("  Mia.Flores "), "mia.flores");
  for (const input of [
    "ab",
    "1usuario",
    "../admin",
    "mía",
    "mia@test",
    "a".repeat(33),
  ])
    assert.throws(() => validateUsername(input));
});
test("contraseña de oficina: mínimo seis caracteres sin composición obligatoria", () => {
  for (const input of [
    "123456",
    "oficina",
    "abcdef",
    "OFICINA",
    "Privada!Clave2026",
    "a".repeat(64),
  ])
    assert.equal(validatePassword(input), input);
  for (const input of [
    "corta",
    "12345",
    "a".repeat(65),
    "aA1!" + "ñ".repeat(40),
  ])
    assert.throws(() => validatePassword(input));
});
test("cumpleaños nulo o completo, con 29 febrero recurrente válido", () => {
  assert.equal(validBirthday(null, null), true);
  assert.equal(validBirthday(29, 2), true);
  for (const pair of [
    [null, 2],
    [4, null],
    [31, 4],
    [30, 2],
    [1, 13],
    [0, 1],
    [1.5, 3],
  ])
    assert.equal(validBirthday(...pair), false);
});
test("validación solo devuelve campos editables, nunca id, role ni estado", () => {
  const result = validateProfileFields({
    first_name: " Mía ",
    last_name: "Flores",
    job_title: "",
    birthday_day: "",
    birthday_month: "",
    role: "admin",
    id: "manipulado",
    is_active: "true",
  });
  assert.deepEqual(result, {
    first_name: "Mía",
    last_name: "Flores",
    job_title: null,
    birthday_day: null,
    birthday_month: null,
  });
});
test("alta exitosa: solo devuelve la identidad después de asociar la foto", async () => {
  const events = [];
  assert.equal(
    await provisionAccount({
      createIdentity: async () => {
        events.push("create");
        return "id";
      },
      attachAvatar: async () => events.push("photo"),
      rollbackIdentity: async () => events.push("rollback"),
      quarantineIdentity: async () => events.push("quarantine"),
    }),
    "id",
  );
  assert.deepEqual(events, ["create", "photo"]);
});
test("fallo de fotografía revierte una cuenta recién creada", async () => {
  const events = [];
  await assert.rejects(
    provisionAccount({
      createIdentity: async () => "id",
      attachAvatar: async () => {
        throw Error("upload");
      },
      rollbackIdentity: async (id) => events.push(id),
      quarantineIdentity: async () => events.push("quarantine"),
    }),
    (error) => error instanceof ProvisionFailure && !error.cleanupFailed,
  );
  assert.deepEqual(events, ["id"]);
});
test("fallo de compensación intenta poner la cuenta en cuarentena", async () => {
  const events = [];
  await assert.rejects(
    provisionAccount({
      createIdentity: async () => "id",
      attachAvatar: async () => {
        throw Error("upload");
      },
      rollbackIdentity: async () => {
        throw Error("delete");
      },
      quarantineIdentity: async (id) => events.push(id),
    }),
    (error) => error instanceof ProvisionFailure && error.cleanupFailed,
  );
  assert.deepEqual(events, ["id"]);
});
test("fallo del alta transaccional no elimina una cuenta preexistente", async () => {
  let touched = false;
  await assert.rejects(
    provisionAccount({
      createIdentity: async () => {
        throw Error("duplicate");
      },
      attachAvatar: async () => {},
      rollbackIdentity: async () => {
        touched = true;
      },
      quarantineIdentity: async () => {
        touched = true;
      },
    }),
  );
  assert.equal(touched, false);
});
