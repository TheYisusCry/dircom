import Image from "next/image";
import { IllustratedIcon, CalendarDays } from "@/components/ui/icon";
import type { WeeklyRecognition } from "@/types";

export function EmployeeFeatured({
  recognition,
}: {
  recognition: WeeklyRecognition;
}) {
  const { winner, weekLabel } = recognition;
  const firstName = winner.name.split(" ")[0];

  return (
    <article className="panel relative flex h-full flex-col overflow-hidden p-5 sm:p-7">
      <span
        className="absolute -right-10 -top-10 size-44 rounded-full bg-mint/80"
        aria-hidden="true"
      />
      <div className="relative flex flex-1 items-center gap-4 sm:gap-6">
        <div className="relative shrink-0 -rotate-2 transition-transform hover:rotate-0 motion-reduce:transform-none">
          <div className="relative h-44 w-28 overflow-hidden rounded-2xl border-[3px] border-forest/30 bg-mint sm:h-60 sm:w-44">
            {winner.photo ? (
              <Image
                src={winner.photo}
                alt={`Retrato de ${winner.name}, empleada destacada de la semana`}
                fill
                sizes="(max-width: 640px) 112px, 176px"
                className="object-cover object-top"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-4xl font-bold text-forest-ink">
                {winner.name[0]}
              </span>
            )}
          </div>
          <span className="absolute -bottom-3 -right-3 flex size-12 items-center justify-center rounded-2xl border-4 border-white bg-[#fff2d4]">
            <IllustratedIcon name="gold" size={29} />
          </span>
        </div>
        <div className="min-w-0 flex-1 py-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-[10px] font-semibold text-forest-ink">
            <IllustratedIcon name="sparkles" size={13} />
            Estrella de la semana
          </span>
          <h3 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight sm:text-[30px]">
            {winner.name}
          </h3>
          <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">
            {winner.role}
          </p>
          <p className="mt-5 text-sm font-semibold text-forest-ink">
            ¡Felicidades, {firstName}!
          </p>
          <p className="mt-1.5 text-xs leading-6 text-muted sm:text-sm">
            Esta semana, el aplauso es para ti.{" "}
            <IllustratedIcon name="trophy" size={16} className="align-middle" />
          </p>
        </div>
      </div>
      <div className="relative mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-mist text-muted">
            <CalendarDays size={18} />
          </span>
          <div>
            <p className="text-[10px] text-muted">Semana reconocida</p>
            <p className="mt-1 text-[11px] font-semibold">{weekLabel}</p>
          </div>
        </div>
        <span className="rounded-full bg-[#fff2d4] px-3 py-1.5 text-[10px] font-bold text-[#785a1e]">
          1.er puesto
        </span>
      </div>
    </article>
  );
}
