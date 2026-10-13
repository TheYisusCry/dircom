"use client";

import { useState } from "react";
import { Plus } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function NewActivityPreview() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus size={17} aria-hidden="true" />
        Proponer actividad
        <span className="rounded bg-mist px-1.5 py-0.5 text-[9px] text-muted">
          Próximamente
        </span>
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Un buen plan empieza con una idea"
      >
        <div className="space-y-5 p-6 sm:p-8">
          <p className="text-sm leading-7 text-muted">
            Aquí podrás proponer un pedido, una pausa o un plan para el equipo.
            La publicación estará disponible al integrar usuarios y
            almacenamiento.
          </p>
          <div className="rounded-lg bg-mint p-3 text-xs font-medium text-forest-ink">
            Vista previa del formulario · No se guardan actividades.
          </div>
          <fieldset disabled className="space-y-4">
            <legend className="sr-only">
              Formulario de ejemplo, todavía no disponible
            </legend>
            <label className="block text-xs font-semibold" htmlFor="new-title">
              Título de la actividad
              <input
                id="new-title"
                placeholder="Por ejemplo: almuerzo compartido"
                className="mt-2 min-h-11 w-full rounded-lg border border-line bg-mist px-3 text-sm disabled:cursor-not-allowed"
              />
            </label>
            <label
              className="block text-xs font-semibold"
              htmlFor="new-description"
            >
              Cuéntale al equipo
              <textarea
                id="new-description"
                rows={3}
                placeholder="¿Cuál es el plan?"
                className="mt-2 w-full resize-none rounded-lg border border-line bg-mist p-3 text-sm disabled:cursor-not-allowed"
              />
            </label>
            <Button disabled className="w-full">
              Publicación pendiente de integración
            </Button>
          </fieldset>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="w-full"
          >
            Volver al tablero
          </Button>
        </div>
      </Modal>
    </>
  );
}
