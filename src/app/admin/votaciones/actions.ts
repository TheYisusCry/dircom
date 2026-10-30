"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
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

    const admin = createAdminClient();
    const result = await admin
      .from("voting_rounds")
      .update({
        status: "closed",
        closes_at: new Date().toISOString(),
      })
      .eq("id", roundId);

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

    const admin = createAdminClient();

    // 1. Fetch raw votes for this round
    const votesRes = await admin
      .from("voting_votes")
      .select("candidate_id")
      .eq("round_id", roundId);

    if (votesRes.error) throw votesRes.error;

    const votes = votesRes.data ?? [];

    // Tally votes
    const counts = new Map<string, number>();
    for (const v of votes) {
      counts.set(v.candidate_id, (counts.get(v.candidate_id) ?? 0) + 1);
    }

    // Sort candidates by vote count descending
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

    // 2. Fetch profiles of top candidates (up to 3)
    const topIds = sorted.slice(0, 3).map(([id]) => id);

    const candidatesMap = new Map<string, { id: string; name: string; role: string; photo?: string }>();
    if (topIds.length > 0) {
      const profsRes = await admin
        .from("profiles")
        .select("id, first_name, last_name, job_title, avatar_path")
        .in("id", topIds);

      if (profsRes.data) {
        for (const p of profsRes.data) {
          candidatesMap.set(p.id, {
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            role: p.job_title ?? "Equipo DIRCOM",
            photo: p.avatar_path ? `/api/avatars/${p.id}` : undefined,
          });
        }
      }
    }

    const defaultRecognitions = [
      "Espíritu de equipo",
      "Creatividad que inspira",
      "Siempre dispuesto a ayudar",
    ];

    const podium = sorted.slice(0, 3).map(([candidateId, voteCount], index) => {
      const profile = candidatesMap.get(candidateId);
      const position = (index + 1) as 1 | 2 | 3;
      return {
        position,
        employee_id: candidateId,
        employee_name: profile?.name ?? "Empleado",
        employee_role: profile?.role ?? "Equipo DIRCOM",
        employee_photo: profile?.photo,
        votes: voteCount,
        recognition: defaultRecognitions[index] ?? "Gran compromiso",
      };
    });

    const winnerId = podium[0]?.employee_id ?? null;

    // 3. Update round with results and status 'published'
    const updateRes = await admin
      .from("voting_rounds")
      .update({
        status: "published",
        winner_id: winnerId,
        podium,
      })
      .eq("id", roundId);

    if (updateRes.error) throw updateRes.error;

    revalidatePath("/");
    revalidatePath("/admin/votaciones");
    return ok("¡Resultados publicados! Todos los usuarios pueden ver el podio ganador en el tablero principal.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al publicar los resultados.";
    return fail(msg);
  }
}
