"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/auth/validation";
import type { ActionState, AnnouncementTone } from "@/types/database";

const ok = (message: string): ActionState => ({ status: "success", message });
const fail = (message: string): ActionState => ({ status: "error", message });

export async function createAnnouncementAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const profile = await requireProfile();
    const title = String(form.get("title") ?? "").trim();
    const rawTone = String(form.get("tone") ?? "general").trim();
    const rawDescription = String(form.get("description") ?? "").trim();

    if (title.length < 3 || title.length > 120) {
      return fail("El título del anuncio debe tener entre 3 y 120 caracteres.");
    }

    const validTones: AnnouncementTone[] = ["urgent", "coffee", "general"];
    const tone = validTones.includes(rawTone as AnnouncementTone)
      ? (rawTone as AnnouncementTone)
      : "general";

    const description = rawDescription.length > 0 ? rawDescription : null;
    if (description && description.length > 1000) {
      return fail("La descripción no puede superar los 1000 caracteres.");
    }

    const admin = createAdminClient();
    const result = await admin.from("announcements").insert({
      title,
      description,
      tone,
      creator_id: profile.id,
      status: "active",
    });

    if (result.error) throw result.error;

    revalidatePath("/");
    return ok("Anuncio publicado en el tablón.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al publicar el anuncio.";
    return fail(msg);
  }
}

export async function closeAnnouncementAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const profile = await requireProfile();
    const announcementId = String(form.get("announcement_id") ?? "").trim();

    if (!UUID_PATTERN.test(announcementId)) {
      return fail("Identificador de anuncio no válido.");
    }

    const admin = createAdminClient();
    const result = await admin
      .from("announcements")
      .update({
        status: "closed",
        closed_by: profile.id,
        closed_at: new Date().toISOString(),
      })
      .eq("id", announcementId);

    if (result.error) throw result.error;

    revalidatePath("/");
    return ok("Anuncio marcado como resuelto.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cerrar el anuncio.";
    return fail(msg);
  }
}
