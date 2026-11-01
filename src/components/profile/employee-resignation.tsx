"use client";

import { useActionState, useState } from "react";
import { resignEmployeeAction } from "@/app/perfil/actions";
import { INITIAL_ACTION } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormFeedback } from "@/components/ui/form-feedback";
import { AlertTriangle } from "@/components/ui/icon";

export function EmployeeResignation() {
  const [modalOpen, setModalOpen] = useState(false);
  const [state, action, pending] = useActionState(
    resignEmployeeAction,
    INITIAL_ACTION,
  );

  return (
    <>
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-sm font-bold text-red-900">
              <AlertTriangle size={18} className="text-red-600" />
              Renunciar a la empresa
            </h3>
            <p className="max-w-xl text-xs leading-5 text-red-700/90">
              Si decides retirarte de tu puesto en DIRCOM, tu cuenta será desactivada
              inmediatamente y se cerrará tu sesión. Solo un administrador podrá
              reincorporarte contratándote de nuevo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 hover:border-red-400"
          >
            Renunciar
          </button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!pending) setModalOpen(false);
        }}
        closeOnClickOutside={false}
        title="¿Confirmas tu renuncia?"
      >
        <form action={action} className="space-y-5 p-4 sm:p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs leading-5 text-red-900">
              <strong>Atención:</strong> Esta acción desactivará tu cuenta de DIRCOM
              y cerrará tu sesión activa en este momento. Dejarás de tener acceso
              al espacio del equipo y no podrás volver a iniciar sesión por tu cuenta.
              Únicamente el administrador podrá reactivar tu cuenta contratándote de nuevo.
            </p>
          </div>

          <FormFeedback state={state} />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={pending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Procesando renuncia…" : "Sí, confirmar renuncia"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
