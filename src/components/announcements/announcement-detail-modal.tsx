"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock3 } from "@/components/ui/icon";
import { announceChange } from "@/components/live/live-provider";
import { closeAnnouncementAction } from "@/app/actions/announcements";
import { INITIAL_ACTION } from "@/types/database";
import type { Announcement } from "@/types";

const toneConfig: Record<
  Announcement["tone"],
  { label: string; icon: string; badgeClass: string; borderClass: string }
> = {
  urgent: {
    label: "Urgente",
    icon: "🚨",
    badgeClass: "bg-red-600 text-white",
    borderClass: "border-red-200 bg-red-50/70",
  },
  coffee: {
    label: "Café / Insumos",
    icon: "☕",
    badgeClass: "bg-[#8b5a2b] text-white",
    borderClass: "border-amber-300 bg-[#fbf6ee]",
  },
  general: {
    label: "Aviso general",
    icon: "📢",
    badgeClass: "bg-forest text-white",
    borderClass: "border-forest/20 bg-mint/70",
  },
  celebration: {
    label: "Celebración",
    icon: "🎉",
    badgeClass: "bg-purple-600 text-white",
    borderClass: "border-purple-200 bg-purple-50/70",
  },
};

function formatAnnouncementTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-BO", {
      hour: "numeric",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    return "";
  }
}

export function AnnouncementDetailModal({
  announcement,
  open,
  onClose,
}: {
  announcement: Announcement;
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(closeAnnouncementAction, INITIAL_ACTION);
  const config = toneConfig[announcement.tone] ?? toneConfig.general;

  useEffect(() => {
    if (state.status === "success") {
      announceChange({ scope: "announcements" });
      const timer = setTimeout(() => {
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Detalle del anuncio" maxWidth="max-w-lg">
      <div className="space-y-5 p-5 sm:p-6">
        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`rounded-xl border p-3.5 text-xs font-semibold ${
              state.status === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-forest/20 bg-mint text-forest-ink"
            }`}
          >
            {state.message}
          </p>
        )}

        <div className={`rounded-2xl border p-4 sm:p-5 ${config.borderClass}`}>
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${config.badgeClass}`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </span>

            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Clock3 size={13} />
              <span>{formatAnnouncementTime(announcement.createdAt)}</span>
            </span>
          </div>

          <h3 className="mt-3 text-base sm:text-lg font-extrabold leading-snug text-ink">
            {announcement.title}
          </h3>

          {announcement.description ? (
            <p className="mt-2.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-ink/85">
              {announcement.description}
            </p>
          ) : (
            <p className="mt-2 text-xs italic text-muted">
              Sin descripción adicional proporcionada.
            </p>
          )}
        </div>

        <form action={formAction} className="pt-2">
          <input type="hidden" name="announcement_id" value={announcement.id} />
          <Button
            type="submit"
            disabled={pending}
            variant="primary"
            className="w-full justify-center gap-2 bg-forest py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-forest-ink"
          >
            <CheckCircle2 size={16} />
            <span>{pending ? "Marcando..." : "Marcar como resuelto / Retirar anuncio"}</span>
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted">
            Cualquier integrante puede retirar este anuncio una vez atendido.
          </p>
        </form>
      </div>
    </Modal>
  );
}
