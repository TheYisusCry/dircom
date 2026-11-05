"use client";

import { useRef, useState } from "react";
import { announceChange } from "@/components/live/live-provider";
import { ActivityThread } from "./activity-thread";
import {
  ArrowRight,
  IllustratedIcon,
  LockKeyhole,
  MessageCircle,
} from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatEventDate } from "@/lib/dates";
import {
  sendActivityMessageAction,
  closeActivityAction,
  deleteActivityAction,
} from "@/app/actions/activities";
import { INITIAL_ACTION } from "@/types/database";
import type { Activity } from "@/types";
import { ActivityMessages } from "./activity-messages";

const icons = { food: "food", coffee: "coffee", social: "social" } as const;
const colors = {
  food: "bg-[#f4ecdc] text-[#8b6023]",
  coffee: "bg-mint text-forest-ink",
  social: "bg-[#e9edf6] text-[#516584]",
};

function ActivityDetailModal({
  activity,
  canManage,
  onClose,
}: {
  activity: Activity;
  canManage: boolean;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [msgPending, setMsgPending] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const [closePending, setClosePending] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const [delPending, setDelPending] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsgError(null);
    setMsgPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await sendActivityMessageAction(INITIAL_ACTION, formData);
      if (result.status === "error") {
        setMsgError(result.message ?? "Error al enviar mensaje.");
      } else {
        formRef.current?.reset();
        announceChange({ scope: "activities", activityId: activity.id });
      }
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : "Error al enviar mensaje.");
    } finally {
      setMsgPending(false);
    }
  };

  const handleCloseActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCloseError(null);
    setClosePending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await closeActivityAction(INITIAL_ACTION, formData);
      if (result.status === "error") {
        setCloseError(result.message ?? "Error al cerrar actividad.");
      } else {
        announceChange({ scope: "activities", activityId: activity.id });
      }
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : "Error al cerrar actividad.");
    } finally {
      setClosePending(false);
    }
  };

  const handleDeleteActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDelError(null);
    setDelPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await deleteActivityAction(INITIAL_ACTION, formData);
      if (result.status === "error") {
        setDelError(result.message ?? "Error al eliminar actividad.");
        setDelPending(false);
      } else {
        announceChange({ scope: "activities", activityId: activity.id });
        onClose();
      }
    } catch (err) {
      setDelError(err instanceof Error ? err.message : "Error al eliminar actividad.");
      setDelPending(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={activity.title}>
      <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <p className="text-sm leading-6 text-muted">{activity.description}</p>
        <div className="rounded-lg bg-mist p-3.5 text-xs leading-6 text-muted sm:p-4">
          Creada por <strong className="text-ink">{activity.creator.name}</strong>
          <br />
          {formatEventDate(activity.createdAt)} ·{" "}
          <span className="font-semibold text-ink">
            {activity.status === "open" ? "Abierta para pedidos" : "Cerrada"}
          </span>
        </div>

        <ActivityThread activityId={activity.id} />

        {/* Formulario para enviar mensaje */}
        {activity.status === "open" ? (
          <form
            ref={formRef}
            onSubmit={handleSendMessage}
            className="border-t border-line pt-4 sm:pt-5"
          >
            {msgError && (
              <p
                role="alert"
                className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-800"
              >
                {msgError}
              </p>
            )}
            <input type="hidden" name="activity_id" value={activity.id} />
            <label htmlFor={`message-${activity.id}`} className="text-xs font-semibold">
              Tu pedido o nota
            </label>
            <textarea
              id={`message-${activity.id}`}
              name="text"
              required
              rows={2}
              maxLength={500}
              placeholder="Por ejemplo: 4 de pollo y 2 bollos..."
              className="auth-input mt-2 resize-none p-3 text-xs leading-5"
            />
            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-muted">
                Presiona enviar para que quede anotado en la lista.
              </p>
              <Button type="submit" disabled={msgPending} className="w-full text-xs sm:w-auto">
                {msgPending ? "Enviando..." : "Anotar mi pedido"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-line bg-mist p-4 text-xs leading-5 text-muted">
            <p className="flex items-center gap-1.5 font-bold text-ink">
              <LockKeyhole size={14} className="text-muted" />
              Actividad finalizada
            </p>
            <p className="mt-0.5">
              Esta actividad está cerrada y no acepta más pedidos. Queda guardada como registro histórico de lo que se pidió.
            </p>
          </div>
        )}

        {/* Acciones de gestión para el creador o admin */}
        {canManage && (
          <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            {closeError && (
              <p role="alert" className="text-xs font-semibold text-red-700">
                {closeError}
              </p>
            )}
            {delError && (
              <p role="alert" className="text-xs font-semibold text-red-700">
                {delError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              {activity.status === "open" && (
                <form onSubmit={handleCloseActivity}>
                  <input type="hidden" name="activity_id" value={activity.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={closePending}
                    className="text-xs"
                  >
                    {closePending ? "Cerrando..." : "Finalizar y cerrar actividad"}
                  </Button>
                </form>
              )}

              <form onSubmit={handleDeleteActivity} className="ml-auto">
                <input type="hidden" name="activity_id" value={activity.id} />
                <button
                  type="submit"
                  disabled={delPending}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  {delPending ? "Eliminando..." : "Eliminar del tablero"}
                </button>
              </form>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full text-xs"
        >
          Cerrar ventana
        </Button>
      </div>
    </Modal>
  );
}

export function ActivityCard({
  activity,
  currentUserId,
  isAdmin,
}: {
  activity: Activity;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const canManage = Boolean(isAdmin || (currentUserId && activity.creator.id === currentUserId));

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
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              activity.status === "open"
                ? "bg-mint text-forest-ink"
                : "bg-mist text-muted"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                activity.status === "open" ? "bg-forest-light" : "bg-muted"
              }`}
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
            {(activity.messageCount ?? activity.messages.length) === 1
              ? "1 mensaje"
              : `${activity.messageCount ?? activity.messages.length} mensajes`}
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

      {open && (
        <ActivityDetailModal
          activity={activity}
          canManage={canManage}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
