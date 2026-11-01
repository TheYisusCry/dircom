"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  SESSION_COOKIE,
  sessionCookieFlags,
} from "@/lib/supabase/config";
import type { ActionState } from "@/types/database";

export async function resignEmployeeAction(
  _state: ActionState,
): Promise<ActionState> {
  void _state;
  const profile = await requireProfile();

  if (profile.role !== "employee") {
    return {
      status: "error",
      message: "Solo las cuentas de empleados pueden renunciar desde este apartado.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "El servicio no está configurado en este momento.",
    };
  }

  try {
    const admin = createAdminClient();

    // 1. Desactivar el perfil del empleado
    const update = await admin
      .from("profiles")
      .update({ is_active: false })
      .eq("id", profile.id);

    if (update.error) {
      return {
        status: "error",
        message: "No se pudo procesar la renuncia. Intenta nuevamente.",
      };
    }

    // 2. Bloquear en Auth para revocar acceso inmediato
    await admin.auth.admin.updateUserById(profile.id, {
      ban_duration: "876000h",
    });

    // 3. Cerrar la sesión en Auth
    try {
      const client = await createSessionClient();
      await client.auth.signOut({ scope: "global" });
    } catch {
      /* Continuar con la limpieza de cookies local */
    }
  } catch {
    return {
      status: "error",
      message: "Ocurrió un error al procesar la renuncia. Intenta más tarde.",
    };
  }

  // 4. Limpiar cookies de sesión del navegador
  const store = await cookies();
  store
    .getAll()
    .filter(
      (cookie) =>
        cookie.name === SESSION_COOKIE ||
        cookie.name.startsWith(`${SESSION_COOKIE}.`),
    )
    .forEach((cookie) =>
      store.set(cookie.name, "", { ...sessionCookieFlags(), maxAge: 0 }),
    );

  redirect("/login?resigned=1");
}
