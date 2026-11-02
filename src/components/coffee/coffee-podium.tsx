import { IllustratedIcon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/auth/validation";
import type { CoffeeLeaderboardEntry } from "@/types/coffee";

const positions = {
  1: {
    column: 2,
    medal: "gold" as const,
    height: "h-32",
    colors: "bg-forest text-on-forest",
    ring: "ring-[#eac46a]",
    label: "Primer puesto",
    subtitle: "¡Gran Cafetero!",
  },
  2: {
    column: 1,
    medal: "silver" as const,
    height: "h-24",
    colors: "bg-[#dfe9f1] text-ink",
    ring: "ring-[#c7d7e3]",
    label: "Segundo puesto",
    subtitle: "Patrocinador Estrella",
  },
  3: {
    column: 3,
    medal: "bronze" as const,
    height: "h-[72px]",
    colors: "bg-[#f2dfc7] text-[#77502f]",
    ring: "ring-[#dfb995]",
    label: "Tercer puesto",
    subtitle: "Aliado del Grano",
  },
} as const;

export function CoffeePodium({
  leaderboard,
}: {
  leaderboard: CoffeeLeaderboardEntry[];
}) {
  const topThree = leaderboard.filter((entry) => entry.totalPackages > 0).slice(0, 3);

  if (topThree.length === 0) {
    return (
      <div className="panel relative flex h-full flex-col justify-center overflow-hidden p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-mint">
          <IllustratedIcon name="coffee" size={28} />
        </div>
        <h3 className="text-base font-bold text-ink">¡Sé el primero en traer café!</h3>
        <p className="mt-1 text-xs text-muted">
          Aún no hay entregas registradas en la oficina. Cuando se anoten las primeras entregas, aquí verás el podio de los más cafeteros.
        </p>
      </div>
    );
  }

  // Mapeamos a los 3 puestos del podio (1° en el medio, 2° a la izquierda, 3° a la derecha)
  const places = [
    topThree[0] ? { ...topThree[0], position: 1 as const } : null,
    topThree[1] ? { ...topThree[1], position: 2 as const } : null,
    topThree[2] ? { ...topThree[2], position: 3 as const } : null,
  ].filter(Boolean) as Array<CoffeeLeaderboardEntry & { position: 1 | 2 | 3 }>;

  return (
    <div className="panel relative flex h-full flex-col overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-ink">
          <IllustratedIcon name="trophy" size={22} />
          Podio Cafetero
        </h3>
        <span className="shrink-0 rounded-full bg-mint px-2.5 py-1 text-[10px] font-bold text-forest-ink">
          Top Donadores
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Los miembros que más café han compartido con la oficina.
      </p>

      <ol
        aria-label="Podio de donadores de café"
        className="relative mt-8 grid flex-1 grid-cols-3 items-end gap-2 sm:gap-3"
      >
        {places.map((entry) => {
          const config = positions[entry.position];
          const photo = avatarUrl({ id: entry.employeeId, avatar_path: entry.avatarPath });

          return (
            <li
              key={entry.employeeId}
              style={{ gridColumn: config.column, gridRow: 1 }}
              className="flex min-w-0 flex-col items-center text-center"
            >
              <span className="sr-only">{config.label}</span>
              <div className="relative mb-2.5">
                {entry.position === 1 && (
                  <IllustratedIcon
                    name="crown"
                    size={26}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 -rotate-12"
                  />
                )}
                <Avatar
                  employee={{ name: entry.employeeName, photo }}
                  size={entry.position === 1 ? 58 : 46}
                  className={`ring-[3px] ring-offset-2 ring-offset-white ${config.ring}`}
                />
              </div>

              <div className="flex min-h-10 flex-col items-center justify-center">
                <strong className="block w-full truncate text-[11px] font-bold text-ink sm:text-xs">
                  {entry.employeeName.split(" ")[0]}
                </strong>
                <span className="text-[10px] font-semibold text-forest-ink">
                  {entry.totalPackages} {entry.totalPackages === 1 ? "paquete" : "paquetes"}
                </span>
              </div>

              <div
                className={`podium-step mt-2 flex w-full flex-col items-center justify-center rounded-t-xl ${config.height} ${config.colors}`}
                style={{
                  animationDelay: `${entry.position === 1 ? 140 : entry.position === 2 ? 70 : 0}ms`,
                }}
                aria-hidden="true"
              >
                <IllustratedIcon name={config.medal} size={28} />
                <span className="mt-1 text-[24px] font-extrabold leading-none">
                  {entry.position}
                  <span className="text-xs">º</span>
                </span>
              </div>

              <span className="mt-2 text-[9px] font-medium text-muted sm:text-[10px]">
                {config.subtitle}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
