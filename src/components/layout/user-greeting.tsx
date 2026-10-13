"use client";

import { useSyncExternalStore } from "react";
import { IllustratedIcon } from "@/components/ui/icon";
import { OFFICE_TIME_ZONE } from "@/lib/dates";
import type { Employee } from "@/types";

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
export function UserGreeting({ profile }: { profile: Pick<Employee, "name"> }) {
  const firstName = profile.name.trim().split(/\s+/)[0];
  const greeting = useSyncExternalStore(
    subscribeClock,
    currentGreeting,
    serverGreeting,
  );

  return (
    <div
      id="inicio"
      className="panel relative my-6 flex items-center justify-between gap-4 overflow-hidden border-forest/15 bg-mint px-5 py-6 sm:my-7 sm:px-7 sm:py-7"
    >
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/10 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-forest-ink">
          <span className="size-1.5 rounded-full bg-forest" />
          Equipo DIRCOM
        </span>
        <h1 className="mt-3 text-[27px] leading-tight font-extrabold tracking-[-0.045em] text-forest-ink sm:text-[33px]">
          {greeting}
          {firstName ? `, ${firstName}` : ""}!{" "}
          <IllustratedIcon name="sparkles" size={29} className="align-middle" />
        </h1>
        <p className="mt-2 max-w-xl text-xs leading-6 text-muted sm:text-sm">
          Ponte al día con los cumpleaños, el reconocimiento semanal y los
          planes del equipo.
        </p>
      </div>
      <div
        className="relative hidden h-28 w-32 shrink-0 items-center justify-center sm:flex"
        aria-hidden="true"
      >
        <span className="absolute size-28 rounded-full border border-forest/10 bg-white/55" />
        <IllustratedIcon
          name="party"
          size={60}
          className="relative -rotate-12"
        />
        <IllustratedIcon
          name="sparkles"
          size={22}
          className="absolute right-0 top-1"
        />
        <span className="absolute bottom-4 left-1 size-2 rounded-full bg-forest/30" />
      </div>
    </div>
  );
}
