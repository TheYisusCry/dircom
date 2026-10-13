"use client";

import { useState } from "react";
import {
  ArrowRight,
  IllustratedIcon,
  LockKeyhole,
  MessageCircle,
} from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatEventDate } from "@/lib/dates";
import type { Activity } from "@/types";
import { ActivityMessages } from "./activity-messages";

const icons = { food: "food", coffee: "coffee", social: "social" } as const;
const colors = {
  food: "bg-[#f4ecdc] text-[#8b6023]",
  coffee: "bg-mint text-forest-ink",
  social: "bg-[#e9edf6] text-[#516584]",
};

export function ActivityCard({ activity }: { activity: Activity }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <article className="panel flex flex-col p-5 transition-shadow hover:shadow-md sm:p-6">
        <div className="flex items-center justify-between">
          <span
            className={`flex size-11 items-center justify-center rounded-xl ${colors[activity.category]}`}
          >
            <IllustratedIcon name={icons[activity.category]} size={25} />
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${activity.status === "open" ? "bg-mint text-forest-ink" : "bg-mist text-muted"}`}
          >
            <span
              className={`size-1.5 rounded-full ${activity.status === "open" ? "bg-forest-light" : "bg-muted"}`}
            />
            {activity.status === "open" ? "Abierta" : "Cerrada"}
          </span>
        </div>
        <h3 className="mt-4 text-lg font-bold tracking-tight">
          {activity.title}
        </h3>
        <p className="mt-1 text-[11px] text-muted">
          Por {activity.creator.name} ·{" "}
          <time dateTime={activity.createdAt}>
            {formatEventDate(activity.createdAt)}
          </time>
        </p>
        <div className="mt-5 flex-1">
          <ActivityMessages messages={activity.messages.slice(-3)} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <span className="flex items-center gap-1.5 text-[10px] text-muted">
            <MessageCircle size={13} aria-hidden="true" />
            {activity.messages.length} mensajes de ejemplo
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Ver actividad: ${activity.title}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-bold text-forest-ink hover:bg-mint"
          >
            Ver actividad <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </article>
      <Modal open={open} onClose={() => setOpen(false)} title={activity.title}>
        <div className="space-y-6 p-6 sm:p-8">
          <p className="text-sm leading-6 text-muted">{activity.description}</p>
          <div className="rounded-lg bg-mist p-4 text-xs leading-6 text-muted">
            Creada por{" "}
            <strong className="text-ink">{activity.creator.name}</strong>
            <br />
            {formatEventDate(activity.createdAt)} ·{" "}
            {activity.status === "open" ? "Abierta" : "Cerrada"}
          </div>
          <ActivityMessages messages={activity.messages} showTime />
          <div className="border-t border-line pt-5">
            <label
              htmlFor={`message-${activity.id}`}
              className="text-xs font-semibold"
            >
              Tu mensaje
            </label>
            <textarea
              id={`message-${activity.id}`}
              disabled
              rows={2}
              placeholder={
                activity.status === "closed"
                  ? "Esta actividad está cerrada."
                  : "Los mensajes estarán disponibles en la próxima etapa."
              }
              className="mt-2 w-full resize-none rounded-lg border border-line bg-mist p-3 text-xs disabled:cursor-not-allowed"
            />
            <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-muted">
              <LockKeyhole
                size={14}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              Conversación de ejemplo. Escribir mensajes requiere autenticación
              y almacenamiento.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            className="w-full"
          >
            Cerrar actividad
          </Button>
        </div>
      </Modal>
    </>
  );
}
