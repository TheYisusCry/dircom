"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/auth/validation";
import type { ActionState } from "@/types/database";

const ok = (message: string): ActionState => ({ status: "success", message });
const fail = (message: string): ActionState => ({ status: "error", message });

export async function saveCelebration(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = form.get("id") ? String(form.get("id")) : undefined;
    const employeeId = String(form.get("employee_id") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();
    const invitation = String(form.get("invitation") ?? "").trim();
    const startsAt = String(form.get("starts_at") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();
    const imageUrl = form.get("image_url") ? String(form.get("image_url")).trim() : null;

    if (id && !UUID_PATTERN.test(id)) return fail("Identificador de celebración inválido.");
    if (!UUID_PATTERN.test(employeeId)) return fail("Selecciona un empleado válido.");
    if (title.length < 3 || title.length > 100)
      return fail("El título debe tener entre 3 y 100 caracteres.");
    if (invitation.length < 5 || invitation.length > 1500)
      return fail("La invitación debe tener entre 5 y 1500 caracteres.");
    if (!startsAt || isNaN(Date.parse(startsAt)))
      return fail("Ingresa una fecha y hora de celebración válida.");
    if (location.length < 3 || location.length > 150)
      return fail("El lugar debe tener entre 3 y 150 caracteres.");

    const admin = createAdminClient();

    // Verify employee exists and is active
    const empCheck = await admin
      .from("profiles")
      .select("id, is_active")
      .eq("id", employeeId)
      .single();

    if (empCheck.error || !empCheck.data?.is_active) {
      return fail("El empleado seleccionado no existe o está inactivo.");
    }

    const isoStartsAt = new Date(startsAt).toISOString();

    if (id) {
      const result = await admin
        .from("birthday_celebrations")
        .update({
          employee_id: employeeId,
          title,
          invitation,
          starts_at: isoStartsAt,
          location,
          image_url: imageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (result.error) throw result.error;
    } else {
      const result = await admin.from("birthday_celebrations").insert({
        employee_id: employeeId,
        title,
        invitation,
        starts_at: isoStartsAt,
        location,
        image_url: imageUrl || null,
      });

      if (result.error) throw result.error;
    }

    revalidatePath("/");
    revalidatePath("/admin/cumpleanos");
    return ok(id ? "Celebración actualizada con éxito." : "Celebración programada con éxito.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error inesperado al guardar la celebración.";
    return fail(msg);
  }
}

export async function deleteCelebration(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = String(form.get("id") ?? "").trim();
    if (!UUID_PATTERN.test(id)) return fail("Celebración inválida.");

    const admin = createAdminClient();
    const result = await admin
      .from("birthday_celebrations")
      .delete()
      .eq("id", id);

    if (result.error) throw result.error;

    revalidatePath("/");
    revalidatePath("/admin/cumpleanos");
    return ok("Celebración eliminada correctamente.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al eliminar la celebración.";
    return fail(msg);
  }
}
