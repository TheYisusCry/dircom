"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/auth/validation";
import { getOfficeCurrentDate } from "@/lib/dates";
import type { ActionState } from "@/types/database";

const ok = (message: string): ActionState => ({ status: "success", message });
const fail = (message: string): ActionState => ({ status: "error", message });

export async function registerCoffeeDeliveryAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const adminProfile = await requireAdmin();
    const employeeId = String(form.get("employee_id") ?? "").trim();
    const rawQuantity = Number(form.get("quantity") ?? 1);
    const quantity = Number.isInteger(rawQuantity) && rawQuantity >= 1 && rawQuantity <= 10 ? rawQuantity : 1;
    const rawDate = String(form.get("delivery_date") ?? "").trim();
    const deliveryDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : getOfficeCurrentDate().todayIso;
    const note = String(form.get("note") ?? "").trim().slice(0, 120) || null;

    if (!UUID_PATTERN.test(employeeId)) {
      return fail("Identificador de empleado no válido.");
    }

    const admin = createAdminClient();

    // Comprobar que el empleado exista
    const empCheck = await admin
      .from("profiles")
      .select("id, first_name, last_name, is_active")
      .eq("id", employeeId)
      .maybeSingle();

    if (!empCheck.data) {
      return fail("El empleado seleccionado no existe.");
    }

    const result = await admin.from("coffee_deliveries").insert({
      employee_id: employeeId,
      quantity,
      delivery_date: deliveryDate,
      note,
      registered_by: adminProfile.id,
    });

    if (result.error) throw result.error;

    revalidatePath("/");
    revalidatePath("/admin/cafe");
    return ok(`Se registró la entrega de ${quantity} paquete(s) de café para ${empCheck.data.first_name}.`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al registrar la entrega de café.";
    return fail(msg);
  }
}

export async function deleteCoffeeDeliveryAction(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
    const deliveryId = String(form.get("delivery_id") ?? "").trim();

    if (!UUID_PATTERN.test(deliveryId)) {
      return fail("Identificador de entrega no válido.");
    }

    const admin = createAdminClient();
    const result = await admin
      .from("coffee_deliveries")
      .delete()
      .eq("id", deliveryId);

    if (result.error) throw result.error;

    revalidatePath("/");
    revalidatePath("/admin/cafe");
    return ok("Entrega eliminada correctamente.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al eliminar la entrega de café.";
    return fail(msg);
  }
}
