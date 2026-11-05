"use client";

import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { CalendarDays, PartyPopper } from "@/components/ui/icon";
import { formatCalendarDate } from "@/lib/dates";
import type { BirthdayPresentation } from "@/types";

function getDaysUntil(todayIso: string, targetIso: string): number {
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const [by, bm, bd] = targetIso.split("-").map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const targetUtc = Date.UTC(by, bm - 1, bd);
  const diffMs = targetUtc - todayUtc;
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function AllBirthdaysModal({
  open,
  onClose,
  birthdays,
  todayIso,
  onSelectCelebration,
}: {
  open: boolean;
  onClose: () => void;
  birthdays: readonly BirthdayPresentation[];
  todayIso: string;
  onSelectCelebration?: (birthday: BirthdayPresentation) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Todos los cumpleaños"
      maxWidth="max-w-2xl"
    >
      <div className="p-5 sm:p-6">
        <div className="max-h-[65vh] space-y-2.5 overflow-y-auto pr-1 sm:pr-2">
          {birthdays.map((item, index) => {
            const daysUntil = getDaysUntil(todayIso, item.nextBirthday);
            const isToday = daysUntil === 0;
            const isTomorrow = daysUntil === 1;

            return (
              <div
                key={item.employee.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                  isToday
                    ? "border-forest bg-mint/50 shadow-2xs"
                    : "border-line bg-white hover:bg-mist/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mist text-[11px] font-bold text-muted">
                    {index + 1}
                  </span>
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-xs font-bold text-ink">
                        {item.employee.name}
                      </p>
                      {isToday && (
                        <span className="rounded bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">
                          ¡Hoy!
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted">
                      {item.employee.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60">
                  <div className="text-left sm:text-right">
                    <p className="flex items-center sm:justify-end gap-1 text-xs font-semibold text-ink">
                      <CalendarDays size={13} className="text-forest shrink-0" />
                      <span>
                        {formatCalendarDate(item.nextBirthday, {
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted">
                      {isToday ? (
                        <span className="font-bold text-forest">¡Es hoy! 🎉</span>
                      ) : isTomorrow ? (
                        <span className="font-bold text-forest-ink">Mañana</span>
                      ) : daysUntil <= 7 ? (
                        <span className="font-semibold text-forest-ink">
                          En {daysUntil} días
                        </span>
                      ) : (
                        <span>En {daysUntil} días</span>
                      )}
                    </p>
                  </div>

                  {item.celebration && (
                    <button
                      type="button"
                      onClick={() => onSelectCelebration?.(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-forest/20 bg-mint px-2.5 py-1 text-xs font-bold text-forest hover:bg-forest/15 transition-colors"
                      title="Ver detalles del festejo"
                    >
                      <PartyPopper size={12} />
                      <span>Festejo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
