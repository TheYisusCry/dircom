"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { announceChange } from "@/components/live/live-provider";
import { createAnnouncementAction } from "@/app/actions/announcements";
import { INITIAL_ACTION, type AnnouncementTone } from "@/types/database";

const toneOptions: Array<{
  value: AnnouncementTone;
  label: string;
  icon: string;
  description: string;
  activeClass: string;
}> = [
  {
    value: "urgent",
    label: "Urgente",
    icon: "🚨",
    description: "Atención inmediata",
    activeClass: "border-red-500 bg-red-50 text-red-950 ring-2 ring-red-400/30",
  },
  {
    value: "coffee",
    label: "Café / Insumos",
    icon: "☕",
    description: "Insumos y cocina",
    activeClass: "border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-500/30",
  },
  {
    value: "general",
    label: "Aviso general",
    icon: "📢",
    description: "Para todo el equipo",
    activeClass: "border-forest bg-mint text-forest-ink ring-2 ring-forest/30",
  },
];

export function NewAnnouncementModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tone, setTone] = useState<AnnouncementTone>("general");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await createAnnouncementAction(INITIAL_ACTION, formData);

      if (result.status === "error") {
        setErrorMessage(result.message ?? "Error al publicar el anuncio.");
        setPending(false);
      } else {
        announceChange({ scope: "announcements" });
        onClose();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al publicar el anuncio.");
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publicar un anuncio en el tablón"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:space-y-5 sm:p-6">
        {errorMessage && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800"
          >
            {errorMessage}
          </p>
        )}

        <fieldset disabled={pending} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink">Tipo de aviso</label>
            <input type="hidden" name="tone" value={tone} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {toneOptions.map((opt) => {
                const isSelected = tone === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTone(opt.value)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition-all ${
                      isSelected
                        ? opt.activeClass
                        : "border-line bg-mist/50 text-muted hover:bg-mist"
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">
                      {opt.icon}
                    </span>
                    <span className="text-xs font-bold leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="announcement-title" className="block text-xs font-semibold text-ink">
              Título del anuncio <span className="text-red-500">*</span>
            </label>
            <input
              id="announcement-title"
              name="title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              placeholder="Ej. ¡SE ACABÓ EL CAFÉ! o ¡Llegaron los paquetes!"
              className="auth-input mt-1.5 text-xs sm:text-sm font-semibold"
            />
            <p className="mt-1 text-[11px] text-muted">
              Un mensaje claro y llamativo visible para todos en el inicio.
            </p>
          </div>

          <div>
            <label htmlFor="announcement-description" className="block text-xs font-semibold text-ink">
              Descripción detallada <span className="text-muted font-normal">(opcional)</span>
            </label>
            <textarea
              id="announcement-description"
              name="description"
              rows={3}
              maxLength={1000}
              placeholder="Agrega detalles o instrucciones si lo consideras necesario..."
              className="auth-input mt-1.5 resize-none text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
              variant="primary"
              className="bg-forest font-bold text-white hover:bg-forest-ink"
            >
              {pending ? "Publicando..." : "Publicar anuncio"}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
