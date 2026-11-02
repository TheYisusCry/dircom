"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/auth/validation";
import type { ActionState } from "@/types/database";

const ok = (message: string): ActionState => ({ status: "success", message });
const fail = (message: string): ActionState => ({ status: "error", message });

export async function openVotingRound(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    // Check if there is already an open round
    const activeCheck = await admin
      .from("voting_rounds")
      .select("id, closes_at")
      .eq("status", "open")
      .maybeSingle();

    if (activeCheck.data) {
      return fail("Ya existe una votación abierta en curso. Ciérrala o espera a que finalice antes de abrir una nueva.");
    }

    const title = String(form.get("title") ?? "").trim();
    const weekLabel = String(form.get("week_label") ?? "").trim();
    const durationMinutes = Number(form.get("duration_minutes") ?? 15);

    if (title.length < 3 || title.length > 100) {
      return fail("El título debe tener entre 3 y 100 caracteres.");
    }
    if (weekLabel.length < 3 || weekLabel.length > 100) {
      return fail("La etiqueta de semana debe tener entre 3 y 100 caracteres.");
    }
    if (![5, 10, 15, 20, 30, 45, 60].includes(durationMinutes)) {
      return fail("Duración de votación inválida.");
    }

    const opensAt = new Date();
    const closesAt = new Date(opensAt.getTime() + durationMinutes * 60 * 1000);

    const result = await admin.from("voting_rounds").insert({
      title,
      week_label: weekLabel,
      status: "open",
      opens_at: opensAt.toISOString(),
      closes_at: closesAt.toISOString(),
    });

    if (result.error) throw result.error;

    revalidatePath("/");
    revalidatePath("/admin/votaciones");
    return ok(`Votación abierta con éxito por ${durationMinutes} minutos.`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al abrir la votación.";
    return fail(msg);
  }
}

export async function closeVotingRound(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
    const roundId = String(form.get("round_id") ?? "").trim();
    if (!UUID_PATTERN.test(roundId)) return fail("Ronda inválida.");

    const client = await createSessionClient();
    const result = await client.rpc("dircom_close_voting_round", { p_round_id: roundId });

    if (result.error) throw result.error;

    revalidatePath("/");
    revalidatePath("/admin/votaciones");
    return ok("Votación finalizada. Ahora puedes publicar los resultados.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cerrar la votación.";
    return fail(msg);
  }
}

export async function publishVotingResults(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
    const roundId = String(form.get("round_id") ?? "").trim();
    if (!UUID_PATTERN.test(roundId)) return fail("Ronda inválida.");

    const client = await createSessionClient();
    const result = await client.rpc("dircom_publish_voting_results", { p_round_id: roundId });
    if (result.error) throw result.error;

    revalidatePath("/");
    revalidatePath("/admin/votaciones");
    return ok("Revelación programada. El equipo verá el podio al terminar la cuenta regresiva de 10 segundos.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al publicar los resultados.";
    return fail(msg);
  }
}
