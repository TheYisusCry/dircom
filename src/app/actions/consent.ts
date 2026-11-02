"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireProfile } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/database";

const ok = (message: string): ActionState => ({ status: "success", message });
const fail = (message: string): ActionState => ({ status: "error", message });

export async function recordConsentAction(
  _prevState: ActionState,
  _form: FormData,
): Promise<ActionState> {
  void _prevState;
  void _form;
  try {
    const profile = await requireProfile();
    if (profile.role !== "employee") {
      return ok("El consentimiento solo aplica a empleados.");
    }

    const headerList = await headers();
    const userAgent = headerList.get("user-agent") ?? "Desconocido";

    const supabase = await createSessionClient();
    const { error } = await supabase.rpc("dircom_record_consent", {
      p_version: "v1",
      p_user_agent: userAgent.slice(0, 500),
    });

    if (error) {
      return fail(`No se pudo registrar el consentimiento: ${error.message}`);
    }

    revalidatePath("/", "layout");
    revalidatePath("/perfil");
    return ok("Consentimiento registrado correctamente.");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado al guardar consentimiento.";
    return fail(message);
  }
}
