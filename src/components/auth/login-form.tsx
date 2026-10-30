"use client";
import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";
import { INITIAL_ACTION } from "@/types/database";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "@/components/ui/icon";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(loginAction, INITIAL_ACTION);
  return (
    <form action={action} className="mt-7 space-y-5">
      <label className="block text-sm font-semibold" htmlFor="username">
        Usuario
        <input
          id="username"
          name="username"
          required
          minLength={3}
          maxLength={32}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          disabled={!configured || pending}
          className="auth-input mt-2"
          placeholder="Tu nombre de usuario"
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="password">
        Contraseña
        <input
          id="password"
          name="password"
          type="password"
          required
          maxLength={128}
          autoComplete="current-password"
          disabled={!configured || pending}
          className="auth-input mt-2"
          placeholder="Tu contraseña"
        />
      </label>
      {state.message && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}
      {!configured && (
        <p className="rounded-xl bg-mist p-4 text-xs leading-6 text-muted">
          El acceso está en preparación. Falta completar la configuración del
          proyecto.
        </p>
      )}
      <Button
        type="submit"
        disabled={!configured || pending}
        className="w-full"
      >
        <LockKeyhole size={18} />
        {pending ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
      <p className="text-center text-xs leading-5 text-muted">
        Las cuentas y las contraseñas las gestiona el administrador.
      </p>
    </form>
  );
}
