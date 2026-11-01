"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CircleHelp,
  Clock3,
  LockKeyhole,
  Trophy,
  Vote,
} from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCountdown, formatEventDate, formatTime } from "@/lib/dates";
import { VotingBallotModal } from "./voting-ballot-modal";
import type { VotingRoundRow } from "@/types/database";

interface Candidate {
  id: string;
  name: string;
  role: string;
  photo?: string;
}

export function VotingStatus({
  activeRound,
  hasVoted,
  candidates,
  isEmployee,
  winnerName,
  weekLabel,
}: {
  activeRound: VotingRoundRow | null;
  hasVoted: boolean;
  candidates: Candidate[];
  isEmployee: boolean;
  winnerName?: string;
  weekLabel?: string;
}) {
  const [ballotOpen, setBallotOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>(() =>
    activeRound?.status === "open" ? formatCountdown(activeRound.closes_at).text : "",
  );

  useEffect(() => {
    if (!activeRound || activeRound.status !== "open") return;

    const interval = setInterval(() => {
      setTimeLeft(formatCountdown(activeRound.closes_at).text);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRound]);

  // Determine state
  if (!activeRound) {
    return (
      <div className="panel mt-5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 rounded-xl bg-mist p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-forest-ink">
              <Trophy size={22} aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold">
                  {winnerName
                    ? "Reconocimiento de la semana publicado"
                    : "Próxima votación por programar"}
                </h3>
                <span className="rounded-full bg-mint px-2 py-1 text-[9px] font-bold text-forest-ink">
                  {winnerName ? "Ganador publicado" : "Próximamente"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                {winnerName
                  ? `${winnerName} · ${weekLabel ?? "Semana actual"}`
                  : "El administrador abrirá la próxima ronda de votación para el equipo."}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Un voto anónimo por empleado y ronda.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setInfoOpen(true)} className="shrink-0">
            <CircleHelp size={16} aria-hidden="true" />
            ¿Cómo funciona?
          </Button>
        </div>
        <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      </div>
    );
  }

  const isOpen = activeRound.status === "open";

  return (
    <div className="panel mt-5 p-5 sm:p-6">
      <div className="flex flex-col gap-5 rounded-xl bg-mist p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-forest-ink">
            {isOpen ? (
              hasVoted ? (
                <CheckCircle2 size={22} className="text-forest" />
              ) : (
                <Vote size={22} className="text-forest" />
              )
            ) : (
              <LockKeyhole size={22} className="text-muted" />
            )}
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold">
                {isOpen
                  ? hasVoted
                    ? "Tu voto está registrado"
                    : "¿Quién hizo la diferencia esta semana?"
                  : "La votación ha finalizado"}
              </h3>
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                  isOpen
                    ? "bg-mint text-forest-ink"
                    : "bg-mist text-muted"
                }`}
              >
                {isOpen
                  ? hasVoted
                    ? "Voto registrado"
                    : "Votación abierta"
                  : "En recuento"}
              </span>

              {isOpen && timeLeft && (
                <span className="flex items-center gap-1 rounded-full bg-forest px-2.5 py-0.5 font-mono text-[10px] font-bold text-white">
                  <Clock3 size={11} />
                  {timeLeft}
                </span>
              )}
            </div>

            <p className="mt-2 text-xs leading-5 text-muted">
              {isOpen
                ? hasVoted
                  ? `Voto registrado para ${activeRound.week_label}. Los resultados se revelarán al cerrar la ronda.`
                  : `Cierre: ${formatEventDate(activeRound.closes_at)} · ${formatTime(activeRound.closes_at)}`
                : `Cerrada el ${formatEventDate(activeRound.closes_at)}. El administrador está por publicar los resultados oficiales.`}
            </p>

            <p className="mt-1 text-[11px] text-muted">
              Votación de 15 minutos · Voto 100% anónimo y único.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isOpen && !hasVoted && isEmployee ? (
            <Button onClick={() => setBallotOpen(true)} className="w-full sm:w-auto">
              <Vote size={16} />
              Emitir mi voto
            </Button>
          ) : !isEmployee ? (
            <Link
              href="/admin/votaciones"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-forest px-4 py-2 text-xs font-bold text-on-forest"
            >
              Panel de votaciones →
            </Link>
          ) : (
            <Button variant="secondary" onClick={() => setInfoOpen(true)}>
              <CircleHelp size={16} />
              Detalles
            </Button>
          )}
        </div>
      </div>

      {ballotOpen && (
        <VotingBallotModal
          round={activeRound}
          candidates={candidates}
          open={ballotOpen}
          onClose={() => setBallotOpen(false)}
        />
      )}

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}

function InfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Reconocimiento del Empleado de la Semana">
      <div className="space-y-4 p-6 text-sm leading-7 text-muted">
        <p>
          En DIRCOM reconocemos el esfuerzo, compromiso y compañerismo de nuestro equipo cada semana.
        </p>
        <div className="rounded-xl bg-mist p-4 text-xs leading-6 text-ink">
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Voto único y secreto:</strong> Cada empleado emite 1 solo voto anónimo.</li>
            <li><strong>Sin auto-voto:</strong> No puedes votarte a ti mismo.</li>
            <li><strong>Exclusión del admin:</strong> El administrador no vota ni puede ser votado.</li>
            <li><strong>Tiempo limitado:</strong> La votación permanece abierta durante 15 minutos.</li>
          </ul>
        </div>
        <p>
          Al cerrarse la ronda, el ganador y el podio de los 3 compañeros destacados se revelan simultáneamente a todos con animación festiva.
        </p>
        <Button onClick={onClose} className="w-full">
          Entendido
        </Button>
      </div>
    </Modal>
  );
}
