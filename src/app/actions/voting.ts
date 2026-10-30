"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import { UUID_PATTERN } from "@/lib/auth/validation";
import type { ActionState } from "@/types/database";

const ok = (message: string): ActionState => ({ status: "success", message });
const fail = (message: string): ActionState => ({ status: "error", message });

export async function castVoteAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const profile = await requireProfile();
    if (profile.role !== "employee") {
      return fail("El administrador no puede participar en la votación.");
    }

    const roundId = String(form.get("round_id") ?? "").trim();
    const candidateId = String(form.get("candidate_id") ?? "").trim();

    if (!UUID_PATTERN.test(roundId) || !UUID_PATTERN.test(candidateId)) {
      return fail("Datos de votación inválidos.");
    }

    if (candidateId === profile.id) {
      return fail("No puedes votar por ti mismo.");
    }

    const client = await createSessionClient();
    const result = await client.rpc("cast_vote", {
      p_round_id: roundId,
      p_candidate_id: candidateId,
    });

    if (result.error) {
      return fail(result.error.message || "No se pudo registrar el voto.");
    }

    revalidatePath("/");
    return ok("¡Tu voto ha sido registrado con éxito!");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al procesar el voto.";
    return fail(msg);
  }
}
