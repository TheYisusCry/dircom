"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormFeedback } from "@/components/ui/form-feedback";
import {
  CalendarClock,
  Clock3,
  LockKeyhole,
  PartyPopper,
  Plus,
  Trophy,
  Users,
  Vote,
} from "@/components/ui/icon";
import { formatCountdown, formatEventDate, formatTime } from "@/lib/dates";
import {
  openVotingRound,
  closeVotingRound,
  publishVotingResults,
} from "@/app/admin/votaciones/actions";
import {
  INITIAL_ACTION,
  type VotingRoundRow,
} from "@/types/database";

export function VotingAdminManager({
  activeRound,
  pastRounds,
  totalEmployees,
  ballotsCount,
}: {
  activeRound: VotingRoundRow | null;
  pastRounds: VotingRoundRow[];
  totalEmployees: number;
  ballotsCount: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(() =>
    activeRound?.status === "open"
      ? formatCountdown(activeRound.closes_at)
      : { text: "", expired: false },
  );

  useEffect(() => {
    if (!activeRound || activeRound.status !== "open") return;

    const interval = setInterval(() => {
      setCountdown(formatCountdown(activeRound.closes_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRound]);

  const [closeState, closeAction, closePending] = useActionState(
    closeVotingRound,
    INITIAL_ACTION,
  );
  const [publishState, publishAction, publishPending] = useActionState(
    publishVotingResults,
    INITIAL_ACTION,
  );

  return (
    <>
      <div className="space-y-6">
        <FormFeedback state={closeState} />
        <FormFeedback state={publishState} />

        {/* Panel de Ronda Activa o Botón para Iniciar */}
        {activeRound ? (
          <div className="panel border-l-4 border-l-forest p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-mint text-forest-ink">
                  <Vote size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{activeRound.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        activeRound.status === "open"
                          ? "bg-mint text-forest-ink"
                          : "bg-mist text-muted"
                      }`}
                    >
                      {activeRound.status === "open"
                        ? "Votación en curso"
                        : "Votación cerrada"}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{activeRound.week_label}</p>
                </div>
              </div>

              {activeRound.status === "open" && countdown.text && (
                <div className="flex items-center gap-2 rounded-xl bg-mist px-4 py-2 font-mono text-sm font-bold text-ink">
                  <Clock3 size={16} className="text-forest" />
                  <span>{countdown.text}</span>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-mist/50 p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Users size={15} />
                  Participación
                </p>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {ballotsCount}{" "}
                  <span className="text-xs font-normal text-muted">
                    de {totalEmployees} empleados
                  </span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-forest transition-all duration-500"
                    style={{
                      width: `${totalEmployees > 0 ? (ballotsCount / totalEmployees) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-line bg-mist/50 p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <CalendarClock size={15} />
                  Horario de apertura
                </p>
                <p className="mt-1 text-sm font-bold text-ink">
                  {formatEventDate(activeRound.opens_at)}
                </p>
                <p className="text-xs text-muted">
                  {formatTime(activeRound.opens_at)}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-mist/50 p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Clock3 size={15} />
                  Límite de votación
                </p>
                <p className="mt-1 text-sm font-bold text-ink">
                  {formatEventDate(activeRound.closes_at)}
                </p>
                <p className="text-xs text-muted">
                  {formatTime(activeRound.closes_at)}
                </p>
              </div>
            </div>

            {/* Acciones de Control */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
              {activeRound.status === "open" ? (
                <form action={closeAction}>
                  <input type="hidden" name="round_id" value={activeRound.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={closePending}
                  >
                    <LockKeyhole size={16} />
                    {closePending
                      ? "Cerrando..."
                      : countdown.expired
                        ? "Cerrar votación (Tiempo finalizado)"
                        : "Cerrar votación anticipadamente"}
                  </Button>
                </form>
              ) : (
                <form action={publishAction}>
                  <input type="hidden" name="round_id" value={activeRound.id} />
                  <Button type="submit" disabled={publishPending}>
                    <Trophy size={16} />
                    {publishPending
                      ? "Calculando podio..."
                      : "Publicar resultados y revelar podio"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="panel flex flex-col items-center justify-center p-8 text-center sm:p-10">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-mint text-forest-ink">
              <Trophy size={28} />
            </span>
            <h2 className="mt-4 text-base font-bold">No hay ninguna votación abierta</h2>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
              Abre una ronda de 15 minutos para que los empleados emitan su voto único y secreto para el reconocimiento de la semana.
            </p>
            <Button className="mt-5" onClick={() => setModalOpen(true)}>
              <Plus size={16} />
              Iniciar nueva votación
            </Button>
          </div>
        )}

        {/* Historial de rondas */}
        <div className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">Historial de votaciones</h2>
          <p className="text-xs text-muted">
            Rondas de reconocimiento anteriores y podios publicados.
          </p>

          {pastRounds.length === 0 ? (
            <p className="mt-4 text-xs text-muted">No hay rondas anteriores registradas.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {pastRounds.map((round) => (
                <div
                  key={round.id}
                  className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{round.title}</h3>
                      <span className="rounded-full bg-mint px-2 py-0.5 text-[9px] font-bold text-forest-ink">
                        Publicada
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{round.week_label}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>
                      Cerrada el {formatEventDate(round.closes_at)}
                    </span>
                    {Array.isArray(round.podium) && round.podium.length > 0 && (
                      <span className="font-semibold text-forest-ink">
                        Ganador: {round.podium[0].employee_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Abrir Nueva Votación */}
      {modalOpen && (
        <OpenVotingModal onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

function OpenVotingModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(openVotingRound, INITIAL_ACTION);

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => onClose(), 800);
      return () => clearTimeout(timer);
    }
  }, [state.status, onClose]);

  // Generate default week label based on current date
  const now = new Date();
  const defaultTitle = "Empleado de la semana";
  const defaultWeek = `Semana del ${now.toLocaleDateString("es-BO", { day: "numeric", month: "long" })}`;

  return (
    <Modal open onClose={onClose} title="Iniciar votación de la semana">
      <form action={formAction} className="space-y-4 p-4 sm:p-6">
        <FormFeedback state={state} />

        <fieldset disabled={pending} className="space-y-4">
          <label className="form-label">
            Título de la votación
            <input
              name="title"
              required
              minLength={3}
              maxLength={100}
              defaultValue={defaultTitle}
              className="auth-input mt-2"
            />
          </label>

          <label className="form-label">
            Etiqueta de la semana
            <input
              name="week_label"
              required
              minLength={3}
              maxLength={100}
              defaultValue={defaultWeek}
              className="auth-input mt-2"
            />
          </label>

          <label className="form-label">
            Duración de la votación
            <select
              name="duration_minutes"
              defaultValue="15"
              className="auth-input mt-2"
            >
              <option value="5">5 minutos (Rápida)</option>
              <option value="10">10 minutos</option>
              <option value="15">15 minutos (Recomendado)</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
            </select>
            <span className="mt-1 block text-[11px] text-muted">
              Al cumplirse este tiempo, la urna se cerrará automáticamente.
            </span>
          </label>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <PartyPopper size={16} />
              {pending ? "Abriendo..." : "Abrir votación ahora"}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
