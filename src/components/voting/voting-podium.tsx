import { IllustratedIcon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import type { PodiumPlace } from "@/types";

const positions = {
  1: {
    column: 2,
    medal: "gold",
    height: "h-32",
    colors: "bg-forest text-on-forest",
    ring: "ring-[#eac46a]",
    label: "Primer puesto",
    subtitle: "¡En lo más alto!",
  },
  2: {
    column: 1,
    medal: "silver",
    height: "h-24",
    colors: "bg-[#dfe9f1] text-ink",
    ring: "ring-[#c7d7e3]",
    label: "Segundo puesto",
    subtitle: "¡Gran trabajo!",
  },
  3: {
    column: 3,
    medal: "bronze",
    height: "h-[72px]",
    colors: "bg-[#f2dfc7] text-[#77502f]",
    ring: "ring-[#dfb995]",
    label: "Tercer puesto",
    subtitle: "¡Bien merecido!",
  },
} as const;

export function VotingPodium({ places }: { places: readonly PodiumPlace[] }) {
  return (
    <div className="panel relative flex h-full flex-col overflow-hidden p-5 sm:p-6">
      <span
        className="absolute right-6 top-20 h-3 w-1.5 rotate-12 rounded-full bg-[#efd892]"
        aria-hidden="true"
      />
      <span
        className="absolute left-8 top-28 size-1.5 rounded-full bg-forest/40"
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <IllustratedIcon name="trophy" size={23} />
          Podio de la semana
        </h3>
        <span className="shrink-0 rounded-full bg-mint px-2.5 py-1 text-[10px] font-semibold text-forest-ink">
          Top 3
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">
        ¡Un aplauso para nuestras estrellas!
      </p>
      <ol
        aria-label="Podio de reconocimiento semanal"
        className="relative mt-9 grid flex-1 grid-cols-3 items-end gap-2 sm:gap-3"
      >
        {[...places]
          .sort((a, b) => a.position - b.position)
          .map(({ position, employee }) => {
            const podium = positions[position];
            return (
              <li
                key={position}
                style={{ gridColumn: podium.column, gridRow: 1 }}
                className="flex min-w-0 flex-col items-center text-center"
              >
                <span className="sr-only">{podium.label}</span>
                <div className="relative mb-3">
                  {position === 1 && (
                    <IllustratedIcon
                      name="crown"
                      size={27}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 -rotate-12"
                    />
                  )}
                  <Avatar
                    employee={employee}
                    size={position === 1 ? 64 : 48}
                    className={`ring-[3px] ring-offset-2 ring-offset-white sm:ring-offset-4 ${podium.ring}`}
                  />
                </div>
                <p className="flex min-h-10 items-center justify-center text-[10px] leading-3.5 font-bold line-clamp-2 sm:text-xs sm:leading-4">
                  {employee.name}
                </p>
                <div
                  className={`podium-step mt-2 flex w-full flex-col items-center justify-center rounded-t-xl ${podium.height} ${podium.colors}`}
                  style={{
                    animationDelay: `${position === 1 ? 140 : position === 2 ? 70 : 0}ms`,
                  }}
                  aria-hidden="true"
                >
                  <IllustratedIcon name={podium.medal} size={28} />
                  <span className="mt-1 text-[25px] leading-none font-extrabold">
                    {position}
                    <span className="text-xs">º</span>
                  </span>
                </div>
                <span className="mt-2 text-[9px] font-medium text-muted sm:text-[10px]">
                  {podium.subtitle}
                </span>
              </li>
            );
          })}
      </ol>
      <p className="mt-5 border-t border-line pt-4 text-center text-[11px] text-muted">
        Tres lugares. Un equipo que lo da todo.{" "}
        <IllustratedIcon name="sparkles" size={13} className="align-middle" />
      </p>
    </div>
  );
}
