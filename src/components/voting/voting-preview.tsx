"use client";

import { useState } from "react";
import { votingPreviews } from "@/data/mock-data";
import type { VotingState } from "@/types";
import { VotingStatus } from "./voting-status";

const states: Record<VotingState, string> = {
  scheduled: "Votación programada",
  open: "Votación abierta",
  registered: "Voto registrado",
  closed: "Votación finalizada",
  published: "Resultado publicado",
};

export function VotingPreview() {
  const [state, setState] = useState<VotingState>("open");
  return (
    <div className="panel mt-5 p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted">
          El próximo reconocimiento empieza contigo.
        </p>
        <label
          className="flex items-center gap-2 text-[10px] font-medium text-muted"
          htmlFor="voting-preview"
        >
          Explorar estados de ejemplo
          <select
            id="voting-preview"
            value={state}
            onChange={(event) => setState(event.target.value as VotingState)}
            className="min-h-10 max-w-48 rounded-lg border border-line bg-white px-2 text-xs text-ink"
          >
            {Object.entries(states).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div aria-live="polite">
        <VotingStatus presentation={votingPreviews[state]} />
      </div>
    </div>
  );
}
