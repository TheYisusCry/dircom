"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAvatar, AVATAR_BUCKET } from "@/lib/auth/photos";
import {
  UUID_PATTERN,
  validatePassword,
  validateProfileFields,
  validateUsername,
} from "@/lib/auth/validation";
import { provisionAccount, ProvisionFailure } from "@/lib/auth/provision";
import type { ActionState } from "@/types/database";

const ok = (message: string): ActionState => ({ status: "success", message });
const fail = (message: string): ActionState => ({ status: "error", message });
function fields(form: FormData) {
  return validateProfileFields(
    Object.fromEntries(
      [
        "first_name",
        "last_name",
        "job_title",
        "birthday_day",
        "birthday_month",
      ].map((key) => [key, String(form.get(key) ?? "")]),
    ),
  );
}
function idFrom(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) throw new Error("Empleado inválido.");
  return id;
}
function photo(form: FormData) {
  const file = form.get("avatar");
  return file instanceof File ? file : null;
}
async function targetEmployee(id: string) {
  const admin = createAdminClient();
  const result = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "employee")
    .single();
  if (result.error || !result.data)
    throw new Error(
      "No se encontró un empleado editable. La cuenta administradora está protegida.",
    );
  return result.data;
}
async function attachPhoto(
  id: string,
  buffer: Buffer,
  previousPath: string | null,
) {
  const admin = createAdminClient();
  const path = `${id}/${randomUUID()}.webp`;
  const upload = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, {
      contentType: "image/webp",
      cacheControl: "0",
      upsert: false,
    });
  if (upload.error) throw new Error("No se pudo subir la fotografía.");
  const update = await admin
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", id);
  if (update.error) {
    await admin.storage.from(AVATAR_BUCKET).remove([path]);
    throw new Error("No se pudo asociar la fotografía.");
  }
  if (previousPath)
    await admin.storage.from(AVATAR_BUCKET).remove([previousPath]);
}
function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/empleados");
  revalidatePath("/");
}

export async function createEmployee(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  let input;
  let username;
  let password;
  let image;
  try {
    input = fields(form);
    username = validateUsername(String(form.get("username") ?? ""));
    password = validatePassword(String(form.get("password") ?? ""));
    image = await normalizeAvatar(photo(form));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Revisa los campos.");
  }
  const admin = createAdminClient();
  const duplicate = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (duplicate.error)
    return fail("No se pudo comprobar el usuario. Intenta más tarde.");
  if (duplicate.data) return fail("Ese usuario ya está asignado. Elige otro.");
  try {
    await provisionAccount({
      createIdentity: async () => {
        const result = await admin.auth.admin.createUser({
          email: `${randomUUID().replaceAll("-", "")}@auth.dircom.invalid`,
          password,
          email_confirm: true,
          app_metadata: {
            dircom_profile: { ...input, username, role: "employee" },
          },
        });
        if (result.error || !result.data.user)
          throw new Error(
            "No se pudo crear el empleado. Revisa el usuario y las migraciones.",
          );
        return result.data.user.id;
      },
      attachAvatar: async (id) => {
        if (image) await attachPhoto(id, image, null);
      },
      rollbackIdentity: async (id) => {
        const result = await admin.auth.admin.deleteUser(id);
        if (result.error) throw new Error("Rollback failed");
      },
      quarantineIdentity: async (id) => {
        const result = await admin
          .from("profiles")
          .update({ is_active: false })
          .eq("id", id);
        await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
        if (result.error)
          throw new Error(
            "No se pudo asegurar el estado de la cuenta. Revisa Supabase antes de reintentar.",
          );
      },
    });
  } catch (error) {
    refresh();
    return fail(
      error instanceof ProvisionFailure
        ? error.message
        : "No se pudo completar el alta. Revisa la conexión y las migraciones antes de reintentar.",
    );
  }
  refresh();
  return ok("Empleado creado. Entrega sus credenciales por un canal privado.");
}

export async function updateEmployee(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  let input;
  let id;
  let image;
  try {
    id = idFrom(form);
    input = fields(form);
    image = await normalizeAvatar(photo(form));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Revisa los campos.");
  }
  try {
    const employee = await targetEmployee(id);
    const result = await createAdminClient()
      .from("profiles")
      .update(input)
      .eq("id", id)
      .eq("role", "employee");
    if (result.error) return fail("No se pudieron guardar los cambios.");
    if (image) {
      try {
        await attachPhoto(id, image, employee.avatar_path);
      } catch {
        refresh();
        return fail(
          "Los datos se guardaron, pero la fotografía no cambió. Puedes volver a subirla.",
        );
      }
    }
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el empleado.",
    );
  }
  refresh();
  return ok("Datos del empleado actualizados.");
}

export async function resetEmployeePassword(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  let id;
  let password;
  try {
    id = idFrom(form);
    password = validatePassword(String(form.get("password") ?? ""));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Revisa los campos.");
  }
  const admin = createAdminClient();
  try {
    await targetEmployee(id);
  } catch {
    return fail("No se encontró un empleado válido para esta operación.");
  }
  const permit = await admin.rpc("dircom_issue_password_update", {
    p_user_id: id,
  });
  if (permit.error || !permit.data)
    return fail(
      "No se pudo autorizar el cambio. Revisa la migración de seguridad.",
    );
  try {
    const result = await admin.auth.admin.updateUserById(id, {
      password,
      app_metadata: { dircom_password_nonce: permit.data },
    });
    if (result.error)
      return fail("No se pudo cambiar la contraseña. Intenta de nuevo.");
  } finally {
    await admin.rpc("dircom_cancel_password_update", {
      p_user_id: id,
      p_nonce: permit.data,
    });
  }
  refresh();
  return ok(
    "Contraseña restablecida. Las sesiones anteriores pierden acceso; el empleado deberá iniciar sesión nuevamente.",
  );
}

export async function changeEmployeeStatus(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  let id;
  try {
    id = idFrom(form);
    await targetEmployee(id);
  } catch {
    return fail("No se encontró un empleado editable.");
  }
  const active = form.get("is_active");
  if (active !== "true" && active !== "false") return fail("Estado inválido.");
  const admin = createAdminClient();
  if (active === "true") {
    const unban = await admin.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (unban.error)
      return fail("No se pudo reactivar la cuenta en Auth. Sigue desactivada.");
    const update = await admin
      .from("profiles")
      .update({ is_active: true })
      .eq("id", id);
    if (update.error)
      return fail(
        "No se pudo activar el perfil. El acceso a DIRCOM sigue bloqueado.",
      );
  } else {
    const update = await admin
      .from("profiles")
      .update({ is_active: false })
      .eq("id", id);
    if (update.error) return fail("No se pudo desactivar el perfil.");
    const ban = await admin.auth.admin.updateUserById(id, {
      ban_duration: "876000h",
    });
    if (ban.error) {
      refresh();
      return fail(
        "El acceso a DIRCOM está bloqueado, pero Auth no confirmó el bloqueo. Reintenta desactivar para sincronizar.",
      );
    }
  }
  refresh();
  return ok(
    active === "true"
      ? "Empleado reactivado. Debe iniciar sesión nuevamente."
      : "Empleado desactivado. El acceso y las fotografías privadas quedan bloqueados.",
  );
}
