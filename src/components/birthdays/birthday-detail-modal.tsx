"use client";

import Image from "next/image";
import {
  CalendarDays,
  Clock3,
  MapPin,
  PartyPopper,
} from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCalendarDate, formatEventDate, formatTime } from "@/lib/dates";
import type { BirthdayPresentation } from "@/types";

export function BirthdayDetailModal({
  birthday,
  open,
  onClose,
}: {
  birthday: BirthdayPresentation;
  open: boolean;
  onClose: () => void;
}) {
  const { employee, celebration, nextBirthday } = birthday;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={celebration?.title ?? `Cumpleaños de ${employee.name}`}
    >
      {celebration?.image && (
        <div className="relative h-48 sm:h-56">
          <Image
            src={celebration.image}
            alt="Torta de cumpleaños preparada para una celebración"
            fill
            sizes="(max-width: 640px) 100vw, 576px"
            className="object-cover"
          />
        </div>
      )}
      <div className="space-y-6 p-6 sm:p-8">
        <p className="flex items-center gap-2 rounded-lg bg-mint px-4 py-3 text-sm font-semibold text-forest-ink">
          <PartyPopper size={19} aria-hidden="true" />
          Su cumpleaños es el {formatCalendarDate(nextBirthday)}.
        </p>
        {celebration ? (
          <>
            <p className="whitespace-pre-line text-sm leading-7 text-muted">
              {celebration.invitation}
            </p>
            <dl className="space-y-4 rounded-xl border border-line p-5 text-sm">
              <div className="flex gap-3">
                <CalendarDays
                  size={19}
                  className="shrink-0 text-forest-ink"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-xs text-muted">
                    Fecha de la celebración
                  </dt>
                  <dd className="mt-1 font-semibold">
                    <time dateTime={celebration.startsAt}>
                      {formatEventDate(celebration.startsAt)}
                    </time>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock3
                  size={19}
                  className="shrink-0 text-forest-ink"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-xs text-muted">Hora · Bolivia</dt>
                  <dd className="mt-1 font-semibold">
                    {formatTime(celebration.startsAt)}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin
                  size={19}
                  className="shrink-0 text-forest-ink"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-xs text-muted">Lugar</dt>
                  <dd className="mt-1 font-semibold">{celebration.location}</dd>
                </div>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm leading-7 text-muted">
            Todavía no hay una celebración programada. Cuando exista una
            invitación, encontrarás aquí su lugar, fecha y hora.
          </p>
        )}
        <p className="text-xs text-muted">
          Invitación de ejemplo · No se registra asistencia.
        </p>
        <Button onClick={onClose} className="w-full">
          Cerrar invitación
        </Button>
      </div>
    </Modal>
  );
}
