"use client";

import { useSyncExternalStore } from "react";
import { IllustratedIcon } from "@/components/ui/icon";
import { AnnouncementBoard } from "@/components/announcements/announcement-board";
import { OFFICE_TIME_ZONE } from "@/lib/dates";
import type { Employee, Announcement } from "@/types";

function currentGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: OFFICE_TIME_ZONE,
    }).format(new Date()),
  );
  return hour >= 6 && hour < 12
    ? "¡Buenos días"
    : hour >= 12 && hour < 19
      ? "¡Buenas tardes"
      : "¡Buenas noches";
}
function subscribeClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}
function serverGreeting() {
  return "¡Hola";
}

/** Uses Bolivia's clock after hydration, while the session profile is still a fixture. */
export function UserGreeting({
  profile,
  announcements = [],
  onOpenCreateAnnouncement,
}: {
  profile: Pick<Employee, "name">;
  announcements?: readonly Announcement[];
  onOpenCreateAnnouncement?: () => void;
}) {
  const firstName = profile.name.trim().split(/\s+/)[0];
  const greeting = useSyncExternalStore(
    subscribeClock,
    currentGreeting,
    serverGreeting,
  );

  return (
    <div
      id="inicio"
      className="panel relative my-6 overflow-hidden border-forest/15 bg-mint p-5 sm:my-7 sm:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-2 lg:items-center">
        {/* Columna 1: Bienvenida */}
        <div className="relative z-10 flex flex-col justify-center">
          <h1 className="text-[23px] sm:text-[27px] leading-tight font-extrabold tracking-[-0.04em] text-forest-ink">
            {greeting}
            {firstName ? `, ${firstName}` : ""}!{" "}
            <IllustratedIcon name="sparkles" size={24} className="align-middle inline-block" />
          </h1>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-muted sm:text-sm">
            Ponte al día con los cumpleaños, el reconocimiento semanal y los planes del equipo.
          </p>
        </div>

        {/* Columna 2: Tablón de Anuncios */}
        <div className="relative z-10">
          <AnnouncementBoard
            announcements={announcements}
            onOpenCreateModal={onOpenCreateAnnouncement}
          />
        </div>
      </div>
    </div>
  );
}
