"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/login/actions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LogOut } from "@/components/ui/icon";

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-red-600 text-white hover:bg-red-700 hover:brightness-100"
    >
      <LogOut size={16} />
      <span>{pending ? "Cerrando sesión..." : "Cerrar sesión"}</span>
    </Button>
  );
}

export function LogoutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-forest-ink hover:bg-mint transition-colors"
      >
        <LogOut size={18} />
        <span className="hidden xl:inline">Salir</span>
      </button>

      {open && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="¿Deseas cerrar sesión?"
          maxWidth="max-w-md"
        >
          <div className="p-5 sm:p-6 space-y-4">
            <p className="text-sm leading-6 text-muted">
              ¿Estás seguro de que deseas salir de tu cuenta? Tendrás que ingresar nuevamente tu usuario y contraseña para acceder a DIRCOM.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>

              <form action={logoutAction}>
                <LogoutSubmitButton />
              </form>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
