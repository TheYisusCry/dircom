// Run manually from a trusted terminal. Never expose this script as an HTTP route.
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  validateUsername,
  validatePassword,
  validateProfileFields,
} from "../src/lib/auth/validation.ts";

try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "Configura la URL y la clave privada del proyecto en .env.local.",
    );
  const username = validateUsername(process.env.DIRCOM_ADMIN_USERNAME ?? "");
  const password = validatePassword(process.env.DIRCOM_ADMIN_PASSWORD ?? "");
  const profile = validateProfileFields({
    first_name: process.env.DIRCOM_ADMIN_FIRST_NAME ?? "",
    last_name: process.env.DIRCOM_ADMIN_LAST_NAME ?? "",
    job_title: "Administrador",
    birthday_day: "",
    birthday_month: "",
  });
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const allowed = await admin.rpc("dircom_can_bootstrap");
  if (allowed.error)
    throw new Error(
      "No se pudo verificar el bootstrap. Aplica primero las migraciones.",
    );
  if (!allowed.data)
    throw new Error("Ya existe un administrador. No se creó otra cuenta.");
  const result = await admin.auth.admin.createUser({
    email: `${randomUUID().replaceAll("-", "")}@auth.dircom.invalid`,
    password,
    email_confirm: true,
    app_metadata: { dircom_profile: { ...profile, username, role: "admin" } },
  });
  if (result.error || !result.data.user)
    throw new Error(
      "No se pudo crear el administrador. Revisa la migración y los requisitos; la transacción de Auth revierte ante un fallo de perfil.",
    );
  const row = await admin
    .from("profiles")
    .select("id,role,is_active")
    .eq("id", result.data.user.id)
    .single();
  if (row.error || row.data?.role !== "admin" || !row.data.is_active)
    throw new Error(
      "Auth respondió al alta, pero no se pudo verificar el perfil. Revisa Supabase antes de reintentar.",
    );
  console.log(
    `Administrador creado: ${username}. Retira las variables DIRCOM_ADMIN_* de .env.local y entrega la contraseña por un canal privado.`,
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "No se pudo inicializar el administrador.",
  );
  process.exitCode = 1;
}
