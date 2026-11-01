import type { ProfileFields } from "../../types/database";

export const USERNAME_PATTERN = /^[^\r\n]{3,32}$/;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}
export function validateUsername(value: string) {
  const normalized = normalizeUsername(value);
  if (!USERNAME_PATTERN.test(normalized))
    throw new Error("El usuario debe tener entre 3 y 32 caracteres.");
  return normalized;
}
export function validatePassword(password: string) {
  if (
    password.length < 6 ||
    password.length > 64 ||
    new TextEncoder().encode(password).length > 72
  ) {
    throw new Error(
      "La contraseña debe tener 6–64 caracteres; máximo 72 bytes.",
    );
  }
  return password;
}
export function validBirthday(day: number | null, month: number | null) {
  if (day === null || month === null) return day === null && month === null;
  const days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    Number.isInteger(day) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= days[month - 1]
  );
}
export function validateProfileFields(
  input: Record<string, string>,
): ProfileFields {
  const first_name = input.first_name?.trim() ?? "";
  const last_name = input.last_name?.trim() ?? "";
  const job_title = input.job_title?.trim() || null;
  if (
    !first_name ||
    !last_name ||
    first_name.length > 60 ||
    last_name.length > 60
  )
    throw new Error(
      "Nombre y apellido son obligatorios, con máximo 60 caracteres cada uno.",
    );
  if (job_title && job_title.length > 100)
    throw new Error("El cargo admite hasta 100 caracteres.");
  const birthday_day = input.birthday_day?.trim()
    ? Number(input.birthday_day)
    : null;
  const birthday_month = input.birthday_month?.trim()
    ? Number(input.birthday_month)
    : null;
  if (!validBirthday(birthday_day, birthday_month))
    throw new Error(
      "Indica día y mes completos y una fecha de cumpleaños válida.",
    );
  return { first_name, last_name, job_title, birthday_day, birthday_month };
}
export function avatarUrl(profile: {
  id: string;
  avatar_path: string | null;
  updated_at: string;
}) {
  return profile.avatar_path
    ? `/api/avatars/${profile.id}?v=${encodeURIComponent(profile.updated_at)}`
    : undefined;
}
