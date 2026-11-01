"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, IllustratedIcon, Plus, Utensils } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createActivityAction } from "@/app/actions/activities";
import { INITIAL_ACTION, type ActivityCategory } from "@/types/database";

export function NewActivityPreview() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ActivityCategory>("food");
  const [state, formAction, pending] = useActionState(createActivityAction, INITIAL_ACTION);

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [state.status, router]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus size={17} aria-hidden="true" />
        Proponer actividad
      </Button>

      {open && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Un buen plan empieza con una idea"
        >
          <form action={formAction} className="space-y-4 p-4 sm:space-y-5 sm:p-6">
            {state.message && (
              <p
                role={state.status === "error" ? "alert" : "status"}
                className={`rounded-xl border p-4 text-sm leading-6 ${
                  state.status === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-forest/20 bg-mint text-forest-ink"
                }`}
              >
                {state.message}
              </p>
            )}

            <p className="text-xs leading-6 text-muted">
              Propón un pedido de comida, una pausa para café o un encuentro para la oficina. Todo el equipo podrá anotar lo que desea pedir.
            </p>

            <fieldset disabled={pending} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold">Tipo de actividad</label>
                <input type="hidden" name="category" value={category} />
                <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory("food")}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-[11px] font-bold transition-all sm:p-3 sm:text-xs ${
                      category === "food"
                        ? "border-forest bg-[#f4ecdc] text-[#8b6023] ring-2 ring-forest/30"
                        : "border-line bg-mist/50 text-muted hover:bg-mist"
                    }`}
                  >
                    <Utensils size={18} />
                    <span>Comida</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("coffee")}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-[11px] font-bold transition-all sm:p-3 sm:text-xs ${
                      category === "coffee"
                        ? "border-forest bg-mint text-forest-ink ring-2 ring-forest/30"
                        : "border-line bg-mist/50 text-muted hover:bg-mist"
                    }`}
                  >
                    <Coffee size={18} />
                    <span>Café / Pausa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("social")}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-[11px] font-bold transition-all sm:p-3 sm:text-xs ${
                      category === "social"
                        ? "border-forest bg-[#e9edf6] text-[#516584] ring-2 ring-forest/30"
                        : "border-line bg-mist/50 text-muted hover:bg-mist"
                    }`}
                  >
                    <IllustratedIcon name="social" size={18} />
                    <span>Encuentro</span>
                  </button>
                </div>
              </div>

              <label className="block text-xs font-semibold" htmlFor="new-title">
                Título del pedido o actividad
                <input
                  id="new-title"
                  name="title"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Por ejemplo: Pedido de empanadas"
                  className="auth-input mt-2"
                />
              </label>

              <label className="block text-xs font-semibold" htmlFor="new-description">
                Detalles o límite de hora para el equipo
                <textarea
                  id="new-description"
                  name="description"
                  required
                  rows={3}
                  minLength={3}
                  maxLength={1000}
                  placeholder="Por ejemplo: Anotemos los pedidos antes de las 11:30. Hay empanadas de pollo y de queso..."
                  className="auth-input mt-2 resize-none p-3 text-xs leading-5"
                />
              </label>

              <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Publicando..." : "Publicar en el tablero"}
                </Button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}
    </>
  );
}
