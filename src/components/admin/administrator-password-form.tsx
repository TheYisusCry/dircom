"use client";
import { useActionState } from "react";
import { changeAdministratorPassword } from "@/app/admin/cuenta/actions";
import { INITIAL_ACTION } from "@/types/database";
import { Button } from "@/components/ui/button";

export function AdministratorPasswordForm() {
  const [state, action, pending] = useActionState(
    changeAdministratorPassword,
    INITIAL_ACTION,
  );
  return (
    <form action={action} className="space-y-5">
      <fieldset disabled={pending} className="space-y-4">
        <label className="form-label">
          Nueva contraseña
          <input
            name="password"
            type="password"
            required
            minLength={6}
            maxLength={64}
            autoComplete="new-password"
            className="auth-input mt-2"
          />
        </label>
        <p className="text-xs leading-6 text-muted">
          Mínimo 6 caracteres. No necesitas combinar mayúsculas, números ni
          símbolos.
        </p>
        <label className="form-label">
          Repetir contraseña
          <input
            name="confirmation"
            type="password"
            required
            minLength={6}
            maxLength={64}
            autoComplete="new-password"
            className="auth-input mt-2"
          />
        </label>
      </fieldset>
      {state.message && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}
      <p className="text-xs leading-6 text-muted">
        Al guardar, volverás al acceso para entrar con tu nueva contraseña.
      </p>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
