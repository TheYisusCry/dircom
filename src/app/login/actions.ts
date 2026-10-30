"use server";
import { createHmac } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseConfigured,
  SESSION_COOKIE,
  sessionCookieFlags,
} from "@/lib/supabase/config";
import { normalizeUsername, USERNAME_PATTERN } from "@/lib/auth/validation";
import type { ActionState } from "@/types/database";

const incorrect: ActionState = {
  status: "error",
  message: "Usuario o contraseña incorrectos.",
};
export async function loginAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured())
    return {
      status: "error",
      message:
        "El acceso todavía no está configurado. Contacta al administrador.",
    };
  const username = normalizeUsername(
    String(form.get("username") ?? "").slice(0, 100),
  );
  const password = String(form.get("password") ?? "");
  const started = performance.now();
  try {
    const admin = createAdminClient();
    const requestHeaders = await headers();
    // On Vercel this header is supplied by the platform. In other environments a
    // single shared IP budget is safer than trusting arbitrary forwarded headers.
    const ip =
      process.env.VERCEL === "1"
        ? (requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0] ??
          "unknown")
        : "local-shared";
    const hash = (value: string) =>
      createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
        .update(value)
        .digest("hex");
    const budget = await admin.rpc("dircom_consume_login_budget", {
      p_subjects: [`account:${hash(username)}`, `ip:${hash(ip)}`, "global"],
    });
    if (budget.error)
      return {
        status: "error",
        message: "El servicio de acceso no está disponible. Intenta más tarde.",
      };
    if (!budget.data)
      return {
        status: "error",
        message:
          "Demasiados intentos. Espera 15 minutos antes de volver a intentar.",
      };
    if (!USERNAME_PATTERN.test(username) || !password || password.length > 128)
      return incorrect;
    const lookup = await admin.rpc("dircom_resolve_username", {
      p_username: username,
    });
    if (lookup.error)
      return {
        status: "error",
        message: "El servicio de acceso no está disponible. Intenta más tarde.",
      };
    // A failed username also performs native password verification. No public
    // resolution endpoint or directory of technical authentication identities.
    const user = lookup.data
      ? await admin.auth.admin.getUserById(lookup.data)
      : null;
    const email =
      user?.data.user?.email ??
      "00000000000000000000000000000000@auth.dircom.invalid";
    const client = await createSessionClient();
    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error || !result.data.user) return incorrect;
    if (!lookup.data) {
      await client.auth.signOut();
      return incorrect;
    }
    const profile = await client.rpc("dircom_my_profile");
    if (profile.error || !profile.data?.[0]?.is_active) {
      await client.auth.signOut();
      return incorrect;
    }
  } catch {
    return {
      status: "error",
      message: "No se pudo iniciar sesión. Intenta más tarde.",
    };
  } finally {
    await delay(Math.max(0, 900 - (performance.now() - started)));
  }
  redirect("/");
}
export async function logoutAction() {
  if (isSupabaseConfigured()) {
    try {
      const client = await createSessionClient();
      await client.auth.signOut({ scope: "global" });
    } catch {
      /* Clear local cookies even if Auth is unavailable. */
    }
  }
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
  redirect("/login");
}
