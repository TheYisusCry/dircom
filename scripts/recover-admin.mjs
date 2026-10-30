// Emergency recovery only: first authorize a nonce in the trusted SQL Editor.
// No web route calls this script. It never issues its own recovery authorization.
import { createClient } from "@supabase/supabase-js";
import { validatePassword, UUID_PATTERN } from "../src/lib/auth/validation.ts";

function uuid(value) {
  if (!value || !UUID_PATTERN.test(value))
    throw new Error("Identificador o permiso de recuperación inválido.");
  return value;
}

try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configura la URL y la clave privada.");
  const id = uuid(process.env.DIRCOM_RECOVERY_ADMIN_ID);
  const nonce = uuid(process.env.DIRCOM_RECOVERY_NONCE);
  const password = validatePassword(process.env.DIRCOM_RECOVERY_PASSWORD ?? "");
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const profile = await admin
    .from("profiles")
    .select("role,is_active")
    .eq("id", id)
    .single();
  if (
    profile.error ||
    profile.data?.role !== "admin" ||
    !profile.data.is_active
  )
    throw new Error(
      "No se verificó un administrador activo. No se cambió la contraseña.",
    );
  const updated = await admin.auth.admin.updateUserById(id, {
    password,
    app_metadata: { dircom_password_nonce: nonce },
  });
  if (updated.error)
    throw new Error(
      "No se confirmó la recuperación. Verifica el permiso de tres minutos y la cuenta antes de reintentar.",
    );
  console.log(
    "Contraseña actualizada. Las sesiones anteriores ya no tienen acceso. Retira DIRCOM_RECOVERY_* de .env.local.",
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "No se pudo recuperar la cuenta.",
  );
  process.exitCode = 1;
}
