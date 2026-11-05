"use client";

import { useEffect, useState } from "react";
import { Plus } from "@/components/ui/icon";
import { AnnouncementDetailModal } from "./announcement-detail-modal";
import type { Announcement } from "@/types";

const toneStyle: Record<
  Announcement["tone"],
  {
    icon: string;
    label: string;
    badgeClass: string;
    cardBorder: string;
    accentBg: string;
    btnHover: string;
  }
> = {
  urgent: {
    icon: "🚨",
    label: "URGENTE",
    badgeClass: "bg-red-600 text-white font-extrabold",
    cardBorder: "border-red-300 bg-red-50/90 shadow-xs",
    accentBg: "bg-red-100/60",
    btnHover: "hover:bg-red-100",
  },
  coffee: {
    icon: "☕",
    label: "CAFÉ / INSUMOS",
    badgeClass: "bg-[#8b5a2b] text-white font-extrabold",
    cardBorder: "border-amber-300 bg-[#fcf8f2] shadow-xs",
    accentBg: "bg-amber-100/60",
    btnHover: "hover:bg-amber-100",
  },
  general: {
    icon: "📢",
    label: "AVISO",
    badgeClass: "bg-forest text-white font-extrabold",
    cardBorder: "border-forest/25 bg-white shadow-xs",
    accentBg: "bg-mint/80",
    btnHover: "hover:bg-mint",
  },
  celebration: {
    icon: "🎉",
    label: "CELEBRACIÓN",
    badgeClass: "bg-purple-600 text-white font-extrabold",
    cardBorder: "border-purple-300 bg-purple-50/90 shadow-xs",
    accentBg: "bg-purple-100/60",
    btnHover: "hover:bg-purple-100",
  },
};

export function AnnouncementBoard({
  announcements,
  onOpenCreateModal,
}: {
  announcements: readonly Announcement[];
  onOpenCreateModal?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Mantener el índice dentro de rango si los anuncios cambian
  const activeCount = announcements.length;
  const safeIndex = activeCount > 0 ? currentIndex % activeCount : 0;
  const currentAnnouncement = announcements[safeIndex];

  useEffect(() => {
    if (activeCount <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeCount);
    }, 8000);
    return () => clearInterval(timer);
  }, [activeCount, isHovered]);

  // Estado vacío: Sin anuncios activos
  if (activeCount === 0 || !currentAnnouncement) {
    return (
      <div className="relative flex min-h-[136px] flex-col justify-between rounded-2xl border border-dashed border-forest/25 bg-white/75 p-4 sm:p-5 backdrop-blur-2xs">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint text-xl shadow-2xs"
            aria-hidden="true"
          >
            ☕
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-forest" />
              <p className="text-xs font-bold tracking-tight text-ink">
                Todo tranquilo en la oficina
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Sin avisos urgentes en este momento. Si necesitas informar algo importante a todo el
              equipo, publícalo aquí.
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-end">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-mint px-3 py-1 text-xs font-bold text-forest-ink hover:bg-forest/15 transition-colors"
          >
            <Plus size={13} />
            <span>Publicar aviso</span>
          </button>
        </div>
      </div>
    );
  }

  const style = toneStyle[currentAnnouncement.tone] ?? toneStyle.general;

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex min-h-[136px] flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all ${style.cardBorder}`}
      >
        <div>
          {/* Cabecera del anuncio */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] tracking-wide uppercase shadow-2xs ${style.badgeClass}`}
            >
              <span>{style.icon}</span>
              <span>{style.label}</span>
            </span>

            <div className="flex items-center gap-2">
              {activeCount > 1 && (
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-muted shadow-2xs">
                  {safeIndex + 1} de {activeCount}
                </span>
              )}
              {isHovered && activeCount > 1 && (
                <span className="text-[10px] font-medium text-muted">⏸ en pausa</span>
              )}
            </div>
          </div>

          {/* Título y descripción breve */}
          <div
            onClick={() => setSelectedAnnouncement(currentAnnouncement)}
            className="mt-2 cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSelectedAnnouncement(currentAnnouncement);
              }
            }}
          >
            <h3 className="text-sm sm:text-base font-black leading-snug tracking-tight text-ink line-clamp-2 hover:underline">
              {currentAnnouncement.title}
            </h3>
            {currentAnnouncement.description && (
              <p className="mt-1 text-xs text-muted line-clamp-1">
                {currentAnnouncement.description}
              </p>
            )}
          </div>
        </div>

        {/* Barra inferior: navegación de carrusel y acción para resolver */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-1 border-t border-black/5">
          {/* Indicadores de carrusel */}
          {activeCount > 1 ? (
            <div className="flex items-center gap-1">
              {announcements.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Ir al anuncio ${idx + 1}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === safeIndex
                      ? "w-4 bg-ink"
                      : "w-1.5 bg-ink/20 hover:bg-ink/40"
                  }`}
                />
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-muted font-medium">Aviso activo</span>
          )}

          <button
            type="button"
            onClick={() => setSelectedAnnouncement(currentAnnouncement)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-ink transition-colors ${style.btnHover}`}
          >
            <span>Ver detalle / Resolver →</span>
          </button>
        </div>
      </div>

      {selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          open={Boolean(selectedAnnouncement)}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </>
  );
}
