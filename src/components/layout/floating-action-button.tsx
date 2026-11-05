"use client";

import { useState } from "react";
import { Plus, Utensils } from "@/components/ui/icon";

export function FloatingActionButton({
  onOpenAnnouncement,
  onOpenActivity,
}: {
  onOpenAnnouncement: () => void;
  onOpenActivity: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Telón de fondo transparente para cerrar al hacer clic fuera */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px] transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Menú de opciones emergentes (Speed Dial) */}
        {open && (
          <div className="flex flex-col items-end gap-2.5 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Opción 1: Publicar Anuncio */}
            <div className="flex items-center gap-2.5">
              <span className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-md select-none">
                📢 Publicar anuncio
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenAnnouncement();
                }}
                aria-label="Publicar anuncio en el tablón"
                className="flex size-11 items-center justify-center rounded-full bg-mint border border-forest/30 text-forest-ink shadow-md hover:bg-forest/15 active:scale-95 transition-all"
              >
                <span className="text-base" aria-hidden="true">
                  📢
                </span>
              </button>
            </div>

            {/* Opción 2: Proponer Actividad Rápida */}
            <div className="flex items-center gap-2.5">
              <span className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-md select-none">
                ⚡ Nueva actividad rápida
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenActivity();
                }}
                aria-label="Proponer actividad rápida"
                className="flex size-11 items-center justify-center rounded-full bg-mint border border-forest/30 text-forest-ink shadow-md hover:bg-forest/15 active:scale-95 transition-all"
              >
                <Utensils size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Botón Principal Flotante (+) */}
        <button
          type="button"
          aria-label={open ? "Cerrar menú de publicación" : "Abrir menú de publicación"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={`flex size-14 items-center justify-center rounded-full text-white shadow-xl transition-all active:scale-95 ${
            open
              ? "bg-ink hover:bg-ink/90 rotate-45"
              : "bg-forest hover:bg-forest-ink hover:shadow-2xl"
          }`}
        >
          <Plus size={26} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
