"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  IllustratedIcon,
  CalendarDays,
  PartyPopper,
} from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { formatCalendarDate, formatEventDate, formatTime } from "@/lib/dates";
import type { BirthdayPresentation } from "@/types";
import { BirthdayDetailModal } from "./birthday-detail-modal";

export function BirthdayFeatured({
  birthday,
}: {
  birthday: BirthdayPresentation;
}) {
  const [open, setOpen] = useState(false);
  const { employee, nextBirthday, celebration } = birthday;

  return (
    <>
      <article className="panel relative grid gap-6 overflow-hidden border-l-4 border-l-forest p-5 sm:p-7 lg:grid-cols-[1fr_270px] lg:gap-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative h-32 w-24 shrink-0 sm:h-44 sm:w-36">
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-mint">
              {employee.photo ? (
                <Image
                  src={employee.photo}
                  alt={`Retrato de ${employee.name}, próximo cumpleaños del equipo`}
                  fill
                  preload
                  sizes="(max-width: 640px) 96px, 144px"
                  className="object-cover object-[center_35%]"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-4xl font-bold text-forest-ink">
                  {employee.name[0]}
                </span>
              )}
            </div>
            <span className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-xl border-4 border-white bg-forest text-on-forest">
              <IllustratedIcon name="cake" size={21} />
            </span>
          </div>
          <div className="min-w-0 py-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-[10px] font-semibold text-forest-ink">
              <PartyPopper size={12} aria-hidden="true" />
              Un día para celebrar
            </span>
            <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-[28px]">
              {employee.name}
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-muted sm:text-sm">
              {employee.role}
            </p>
            <p className="mt-3 max-w-md text-xs leading-6 text-muted sm:text-sm">
              Un año más de buenas ideas, sonrisas y momentos compartidos. ¡Qué
              alegría celebrar contigo!
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-mist px-5 py-5 text-center">
          <span className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            <CalendarDays size={13} aria-hidden="true" />
            Su cumpleaños
          </span>
          <time
            dateTime={nextBirthday}
            className="text-[25px] font-bold tracking-tight text-ink"
          >
            {formatCalendarDate(nextBirthday)}
          </time>
          <p className="mt-1 text-xs capitalize text-muted">
            {
              formatCalendarDate(nextBirthday, {
                weekday: "long",
                year: "numeric",
              }).split(",")[0]
            }{" "}
            · {nextBirthday.slice(0, 4)}
          </p>
          <Button onClick={() => setOpen(true)} className="mt-4 w-full">
            Ver detalles
            <ArrowUpRight size={16} aria-hidden="true" />
          </Button>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            {celebration ? (
              <>
                Celebración:{" "}
                <time dateTime={celebration.startsAt}>
                  {formatEventDate(celebration.startsAt)}
                </time>
                <br />
                {formatTime(celebration.startsAt)} · Hora de Bolivia
              </>
            ) : (
              "Celebración por programar"
            )}
          </p>
        </div>
      </article>
      <BirthdayDetailModal
        birthday={birthday}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
