"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Cake, CalendarDays, PartyPopper } from "@/components/ui/icon";
import { formatCalendarDate } from "@/lib/dates";
import { BirthdayDetailModal } from "./birthday-detail-modal";
import type { BirthdayPresentation } from "@/types";

export function UpcomingBirthdaysList({
  birthdays,
  todayIso,
}: {
  birthdays: readonly BirthdayPresentation[];
  todayIso: string;
}) {
  const [selectedBirthday, setSelectedBirthday] = useState<BirthdayPresentation | null>(null);

  if (birthdays.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-mint text-forest-ink">
              <Cake size={16} />
            </span>
            <h4 className="text-sm font-bold tracking-tight text-ink">
              Próximos cumpleaños
            </h4>
          </div>
          <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-muted">
            {birthdays.length === 1
              ? "Próximo cumpleaños en agenda"
              : `Próximos ${birthdays.length} en agenda`}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {birthdays.map((item) => {
            const isToday = item.nextBirthday === todayIso;

            return (
              <div
                key={item.employee.id}
                className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  isToday
                    ? "border-forest bg-mint/40"
                    : "border-line bg-mist/60 hover:bg-mist"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar employee={item.employee} size={42} />
                  {isToday && (
                    <span
                      title="¡Cumpleaños hoy!"
                      className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-forest text-[10px] text-white"
                    >
                      🎉
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-bold text-ink">
                      {item.employee.name}
                    </p>
                    {isToday && (
                      <span className="rounded bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">
                        ¡Hoy!
                      </span>
                    )}
                  </div>

                  <p className="flex items-center gap-1 text-[11px] text-muted mt-0.5">
                    <CalendarDays size={12} className="shrink-0 text-forest" />
                    <span>
                      {formatCalendarDate(item.nextBirthday, {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </p>

                  {item.celebration ? (
                    <button
                      type="button"
                      onClick={() => setSelectedBirthday(item)}
                      className="mt-1 flex items-center gap-1 text-[10px] font-bold text-forest hover:underline"
                    >
                      <PartyPopper size={11} />
                      Ver festejo
                    </button>
                  ) : (
                    <span className="mt-0.5 block truncate text-[10px] text-muted">
                      {item.employee.role}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedBirthday && (
        <BirthdayDetailModal
          birthday={selectedBirthday}
          open={Boolean(selectedBirthday)}
          onClose={() => setSelectedBirthday(null)}
        />
      )}
    </>
  );
}
