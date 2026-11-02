"use client";

import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Coffee } from "@/components/ui/icon";
import { avatarUrl } from "@/lib/auth/validation";
import type { CoffeeLeaderboardEntry } from "@/types/coffee";

export function CoffeeLeaderboardModal({
  leaderboard,
  onClose,
}: {
  leaderboard: CoffeeLeaderboardEntry[];
  onClose: () => void;
}) {
  return (
    <Modal
      open={true}
      title="Tabla General de Donadores de Café"
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Ranking histórico acumulado con todos los aportes de café del equipo.
          </p>
          <span className="self-start sm:self-auto rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-ink">
            {leaderboard.length} miembros
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-line pr-2 sm:pr-3">
          {leaderboard.map((entry) => {
            const photo = avatarUrl({ id: entry.employeeId, avatar_path: entry.avatarPath });
            const hasDeliveries = entry.totalPackages > 0;

            const isGold = hasDeliveries && entry.rank === 1;
            const isSilver = hasDeliveries && entry.rank === 2;
            const isBronze = hasDeliveries && entry.rank === 3;

            return (
              <div
                key={entry.employeeId}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isGold
                        ? "bg-[#eac46a] text-amber-950 font-black shadow-xs ring-2 ring-[#eac46a]/40"
                        : isSilver
                          ? "bg-[#c7d7e3] text-slate-800 font-black shadow-xs ring-2 ring-[#c7d7e3]/40"
                          : isBronze
                            ? "bg-[#dfb995] text-amber-900 font-black shadow-xs ring-2 ring-[#dfb995]/40"
                            : "bg-mist text-muted font-medium"
                    }`}
                  >
                    {entry.rank}
                  </span>

                  <Avatar employee={{ name: entry.employeeName, photo }} size={40} className="shrink-0" />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-ink truncate">
                        {entry.employeeName}
                      </span>
                      {hasDeliveries && entry.badge && (
                        <span className="hidden sm:inline-flex rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold text-forest-ink">
                          {entry.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted truncate">
                      {entry.jobTitle ?? "Miembro de DIRCOM"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                      hasDeliveries
                        ? "bg-mint text-forest-ink border border-forest/20 shadow-2xs"
                        : "bg-mist text-muted border border-line"
                    }`}
                  >
                    <Coffee size={14} className={hasDeliveries ? "text-forest" : "text-muted"} />
                    <span>
                      {entry.totalPackages} {entry.totalPackages === 1 ? "paquete" : "paquetes"}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
