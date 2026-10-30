"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Cake, CalendarDays, PartyPopper } from "@/components/ui/icon";
import { formatCalendarDate } from "@/lib/dates";
import { BirthdayDetailModal } from "./birthday-detail-modal";
import type { BirthdayCelebration, BirthdayPresentation, Employee } from "@/types";

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function BirthdayMonthList({
  employees,
  celebrations,
  currentMonth,
  currentYear,
  todayIso,
}: {
  employees: readonly Employee[];
  celebrations: readonly BirthdayCelebration[];
  currentMonth: number;
  currentYear: number;
  todayIso: string;
}) {
  const [selectedBirthday, setSelectedBirthday] = useState<BirthdayPresentation | null>(null);

  const monthName = monthNames[currentMonth - 1] ?? "este mes";

  if (employees.length === 0) {
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
            <h4 className="text-sm font-bold tracking-tight">
              Cumpleaños de {monthName}
            </h4>
          </div>
          <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-muted">
            {employees.length === 1
              ? "1 cumpleañero este mes"
              : `${employees.length} cumpleañeros este mes`}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {employees.map((emp) => {
            const bdayIso = `${currentYear}-${String(emp.birthday.month).padStart(2, "0")}-${String(
              emp.birthday.day,
            ).padStart(2, "0")}`;
            const isToday = bdayIso === todayIso;

            const celebration = celebrations.find((c) => c.employeeId === emp.id);

            return (
              <div
                key={emp.id}
                className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  isToday
                    ? "border-forest bg-mint/40"
                    : "border-line bg-mist/60 hover:bg-mist"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar employee={emp} size={42} />
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
                      {emp.name}
                    </p>
                    {isToday && (
                      <span className="rounded bg-forest px-1.5 py-0.2 text-[9px] font-bold text-white">
                        ¡Hoy!
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-[11px] text-muted">
                    <CalendarDays size={12} className="shrink-0 text-forest" />
                    {formatCalendarDate(bdayIso, { day: "numeric", month: "short" })}
                  </p>

                  {celebration ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBirthday({
                          employee: emp,
                          nextBirthday: bdayIso,
                          celebration,
                        })
                      }
                      className="mt-1 flex items-center gap-1 text-[10px] font-bold text-forest hover:underline"
                    >
                      <PartyPopper size={11} />
                      Ver festejo
                    </button>
                  ) : (
                    <span className="mt-1 block text-[10px] text-muted">
                      {emp.role}
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
