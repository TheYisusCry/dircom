import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export const getSessionProfile = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const client = await createSessionClient();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const result = await client.rpc("dircom_my_profile");
  if (result.error)
    throw new Error(
      "No se pudo verificar el acceso. Revisa la migración y la conexión.",
    );
  return result.data?.[0] ?? null;
});
export async function requireProfile() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return profile;
}
export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/acceso-denegado");
  return profile;
}
