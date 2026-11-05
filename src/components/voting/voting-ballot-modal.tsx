"use client";

import { useState } from "react";
import { announceChange } from "@/components/live/live-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LockKeyhole, PartyPopper } from "@/components/ui/icon";
import { castVoteAction } from "@/app/actions/voting";
import { INITIAL_ACTION, type VotingRoundRow } from "@/types/database";

interface Candidate {
  id: string;
  name: string;
  role: string;
  photo?: string;
}

export function VotingBallotModal({
  round,
  candidates,
  open,
  onClose,
}: {
  round: VotingRoundRow;
  candidates: Candidate[];
  open: boolean;
  onClose: () => void;
}) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCandidateId) return;
    setErrorMessage(null);
    setPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await castVoteAction(INITIAL_ACTION, formData);

      if (result.status === "error") {
        setErrorMessage(result.message ?? "Error al registrar el voto.");
        setPending(false);
      } else {
        announceChange({ scope: "voting" });
        onClose();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al registrar el voto.");
      setPending(false);
    }
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="¿Quién hizo la diferencia esta semana?"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:space-y-4 sm:p-5">
        <input type="hidden" name="round_id" value={round.id} />
        <input type="hidden" name="candidate_id" value={selectedCandidateId ?? ""} />

        {errorMessage && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-6 text-red-800 font-semibold"
          >
            {errorMessage}
          </p>
        )}

        <div className="rounded-xl bg-mist p-3 text-xs leading-5 text-muted">
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <LockKeyhole size={14} className="text-forest" />
            Voto 100% único y anónimo
          </p>
          <p className="mt-0.5">
            Elige a un compañero de oficina. Nadie sabrá por quién votaste, ni siquiera el administrador.
          </p>
        </div>

        {candidates.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted">
            No hay candidatos disponibles para votar.
          </p>
        ) : (
          <div className="max-h-[216px] space-y-2 overflow-y-auto pr-2">
            {candidates.map((cand) => {
              const isSelected = selectedCandidateId === cand.id;
              return (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => setSelectedCandidateId(cand.id)}
                  disabled={pending}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
                    isSelected
                      ? "border-forest bg-mint/50 ring-2 ring-forest/30"
                      : "border-line bg-white hover:border-forest/40 hover:bg-mist/50"
                  }`}
                >
                  <Avatar employee={{ name: cand.name, photo: cand.photo }} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{cand.name}</p>
                    <p className="truncate text-xs text-muted">{cand.role}</p>
                  </div>
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-forest bg-forest text-white"
                        : "border-line bg-white"
                    }`}
                  >
                    {isSelected && <span className="size-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!selectedCandidateId || pending}
            className="w-full sm:w-auto"
          >
            <PartyPopper size={16} />
            {pending
              ? "Registrando voto..."
              : selectedCandidate
                ? `Confirmar voto por ${selectedCandidate.name.split(" ")[0]}`
                : "Selecciona a un compañero"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
