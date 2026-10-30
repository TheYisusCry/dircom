"use server";

import { requireAdmin } from "@/lib/auth/session";
import { validatePassword } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logoutAction } from "@/app/login/actions";
import type { ActionState } from "@/types/database";

export async function changeAdministratorPassword(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  let password;
  try {
    password = validatePassword(String(form.get("password") ?? ""));
    if (password !== String(form.get("confirmation") ?? ""))
      return { status: "error", message: "Las contraseñas no coinciden." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Revisa la contraseña.",
    };
  }
  const admin = createAdminClient();
  // The profile id comes exclusively from the checked session, never FormData.
  const permit = await admin.rpc("dircom_issue_admin_password_update", {
    p_user_id: profile.id,
  });
  if (permit.error || !permit.data)
    return {
      status: "error",
      message: "No se pudo autorizar el cambio de contraseña.",
    };
  try {
    const result = await admin.auth.admin.updateUserById(profile.id, {
      password,
      app_metadata: { dircom_password_nonce: permit.data },
    });
    if (result.error)
      return {
        status: "error",
        message:
          "No se confirmó el cambio. Comprueba la conexión antes de reintentar.",
      };
  } catch {
    return {
      status: "error",
      message:
        "No se confirmó el cambio. Comprueba la conexión antes de reintentar.",
    };
  } finally {
    await admin.rpc("dircom_cancel_password_update", {
      p_user_id: profile.id,
      p_nonce: permit.data,
    });
  }
  // Password changes revoke prior sessions. Remove their cookies before returning
  // to the login screen; keep redirects outside the error handler.
  await logoutAction();
  return { status: "success", message: "Contraseña actualizada." };
}
