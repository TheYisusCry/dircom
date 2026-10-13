"use client";

import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  LockKeyhole,
  Trophy,
  Vote,
} from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatEventDate, formatTime } from "@/lib/dates";
import type { VotingPresentation } from "@/types";

export function VotingStatus({
  presentation,
}: {
  presentation: VotingPresentation;
}) {
  const [open, setOpen] = useState(false);
  const descriptions = {
    scheduled: {
      title: "La próxima votación está programada",
      icon: CalendarClock,
      badge: "Programada",
    },
    open: {
      title: "¿Quién hizo la diferencia esta semana?",
      icon: Vote,
      badge: "Votación abierta",
    },
    registered: {
      title: "Tu voto está registrado",
      icon: CheckCircle2,
      badge: "Voto registrado",
    },
    closed: {
      title: "La votación ha finalizado",
      icon: LockKeyhole,
      badge: "Finalizada",
    },
    published: {
      title: "Ya tenemos un nuevo reconocimiento",
      icon: Trophy,
      badge: "Resultado publicado",
    },
  };
  const { title, icon: Icon, badge } = descriptions[presentation.state];
  let detail: string;
  switch (presentation.state) {
    case "scheduled":
      detail = `Apertura: ${formatEventDate(presentation.opensAt)} · ${formatTime(presentation.opensAt)}`;
      break;
    case "open":
    case "registered":
      detail = `Cierre: ${formatEventDate(presentation.closesAt)} · ${formatTime(presentation.closesAt)}`;
      break;
    case "closed":
      detail = `Cerrada el ${formatEventDate(presentation.closedAt)}. El resultado está pendiente de publicación.`;
      break;
    case "published":
      detail = `${presentation.recognition.winner.name} · ${presentation.recognition.weekLabel}`;
      break;
  }
  return (
    <>
      <div className="flex flex-col gap-5 rounded-xl bg-mist p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-forest-ink">
            <Icon size={22} aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold">{title}</h3>
              <span className="rounded-full bg-mint px-2 py-1 text-[9px] font-bold text-forest-ink">
                {badge}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>
            <p className="mt-1 text-[11px] text-muted">
              Vista de ejemplo · Un voto anónimo por empleado y ronda.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => setOpen(true)}
          className="shrink-0"
        >
          <CircleHelp size={16} aria-hidden="true" />
          {presentation.state === "open"
            ? "Ver cómo funcionará"
            : "Acerca de esta vista"}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Votaciones · Primera etapa"
      >
        <div className="space-y-5 p-6 text-sm leading-7 text-muted">
          <p>
            Estás explorando el diseño del estado «{badge}». Ningún voto se ha
            emitido ni guardado.
          </p>
          <p>
            En una próxima etapa, cada empleado podrá emitir un voto anónimo por
            ronda, sin votarse a sí mismo. El administrador no votará y definirá
            la duración. Los empates abrirán una nueva ronda.
          </p>
          <p>
            La validación, el almacenamiento y la revelación sincronizada se
            incorporarán con el backend.
          </p>
          <Button onClick={() => setOpen(false)}>Entendido</Button>
        </div>
      </Modal>
    </>
  );
}
