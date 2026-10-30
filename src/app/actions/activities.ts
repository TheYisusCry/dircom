"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/auth/validation";
import type { ActionState, ActivityCategory } from "@/types/database";

const ok = (message: string): ActionState => ({ status: "success", message });
const fail = (message: string): ActionState => ({ status: "error", message });

export async function createActivityAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const profile = await requireProfile();
    const title = String(form.get("title") ?? "").trim();
    const category = String(form.get("category") ?? "food").trim() as ActivityCategory;
    const description = String(form.get("description") ?? "").trim();

    if (title.length < 3 || title.length > 100) {
      return fail("El título debe tener entre 3 y 100 caracteres.");
    }
    if (!["food", "coffee", "social"].includes(category)) {
      return fail("Categoría de actividad no válida.");
    }
    if (description.length < 3 || description.length > 1000) {
      return fail("La descripción debe tener entre 3 y 1000 caracteres.");
    }

    const admin = createAdminClient();
    const result = await admin.from("activities").insert({
      title,
      category,
      description,
      creator_id: profile.id,
      status: "open",
    });

    if (result.error) throw result.error;

    revalidatePath("/");
    return ok("Actividad publicada en el tablero con éxito.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al crear la actividad.";
    return fail(msg);
  }
}

export async function sendActivityMessageAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const profile = await requireProfile();
    const activityId = String(form.get("activity_id") ?? "").trim();
    const text = String(form.get("text") ?? "").trim();

    if (!UUID_PATTERN.test(activityId)) return fail("Actividad inválida.");
    if (text.length < 1 || text.length > 500) {
      return fail("El mensaje debe tener entre 1 y 500 caracteres.");
    }

    const admin = createAdminClient();

    // Verify activity is open
    const actRes = await admin
      .from("activities")
      .select("status")
      .eq("id", activityId)
      .single();

    if (actRes.error || !actRes.data) return fail("La actividad no existe.");
    if (actRes.data.status !== "open") {
      return fail("Esta actividad está cerrada y ya no acepta nuevos mensajes o pedidos.");
    }

    const result = await admin.from("activity_messages").insert({
      activity_id: activityId,
      author_id: profile.id,
      text,
    });

    if (result.error) throw result.error;

    revalidatePath("/");
    return ok("Mensaje anotado correctamente.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al enviar el mensaje.";
    return fail(msg);
  }
}

export async function closeActivityAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const profile = await requireProfile();
    const activityId = String(form.get("activity_id") ?? "").trim();
    if (!UUID_PATTERN.test(activityId)) return fail("Actividad inválida.");

    const admin = createAdminClient();
    const actRes = await admin
      .from("activities")
      .select("creator_id")
      .eq("id", activityId)
      .single();

    if (actRes.error || !actRes.data) return fail("La actividad no existe.");

    // Only creator or admin can close
    if (actRes.data.creator_id !== profile.id && profile.role !== "admin") {
      return fail("Solo quien creó la actividad o el administrador pueden finalizarla.");
    }

    const result = await admin
      .from("activities")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", activityId);

    if (result.error) throw result.error;

    revalidatePath("/");
    return ok("Actividad cerrada con éxito.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cerrar la actividad.";
    return fail(msg);
  }
}

export async function deleteActivityAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const profile = await requireProfile();
    const activityId = String(form.get("activity_id") ?? "").trim();
    if (!UUID_PATTERN.test(activityId)) return fail("Actividad inválida.");

    const admin = createAdminClient();
    const actRes = await admin
      .from("activities")
      .select("creator_id")
      .eq("id", activityId)
      .single();

    if (actRes.error || !actRes.data) return fail("La actividad no existe.");

    if (actRes.data.creator_id !== profile.id && profile.role !== "admin") {
      return fail("Solo quien creó la actividad o el administrador pueden eliminarla.");
    }

    const result = await admin.from("activities").delete().eq("id", activityId);
    if (result.error) throw result.error;

    revalidatePath("/");
    return ok("Actividad eliminada del tablero.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al eliminar la actividad.";
    return fail(msg);
  }
}
