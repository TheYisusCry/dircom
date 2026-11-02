"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { IllustratedIcon, Coffee, Trophy, ArrowRight } from "@/components/ui/icon";
import { CoffeeStatusGrid } from "@/components/coffee/coffee-status-grid";
import { CoffeePodium } from "@/components/coffee/coffee-podium";
import { CoffeeLeaderboardModal } from "@/components/coffee/coffee-leaderboard-modal";
import type {
  CoffeeLeaderboardEntry,
  CoffeeOfficeSummary,
  EmployeeCoffeeStatus,
} from "@/types/coffee";

export function CoffeeSection({
  statuses,
  leaderboard,
  summary,
  isAdmin,
}: {
  statuses: EmployeeCoffeeStatus[];
  leaderboard: CoffeeLeaderboardEntry[];
  summary: CoffeeOfficeSummary;
  isAdmin: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section id="cafe" aria-labelledby="coffee-heading" className="mt-8 sm:mt-10">
      <SectionHeading
        id="coffee-heading"
        title="El Café del Mes"
        subtitle="Organización y reconocimiento de los aportes de café del equipo."
        icon={<IllustratedIcon name="coffee" size={22} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/cafe"
              className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-mint px-3 py-1.5 text-xs font-semibold text-forest-ink hover:bg-forest/15 transition-colors"
            >
              <Coffee size={14} />
              <span>Gestionar</span>
              <ArrowRight size={13} />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mist transition-colors shadow-2xs"
          >
            <Trophy size={14} className="text-amber-600" />
            <span>Ranking histórico</span>
          </button>
        </div>
      </SectionHeading>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <CoffeeStatusGrid statuses={statuses} summary={summary} />
        <CoffeePodium leaderboard={leaderboard} />
      </div>

      {modalOpen && (
        <CoffeeLeaderboardModal
          leaderboard={leaderboard}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}
