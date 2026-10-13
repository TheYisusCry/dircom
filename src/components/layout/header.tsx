import { demoProfile } from "@/data/mock-data";
import { Avatar } from "@/components/ui/avatar";
import { Navigation } from "./navigation";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="relative mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
        <a
          href="#inicio"
          aria-label="DIRCOM · Inicio"
          className="flex shrink-0 items-center gap-2.5"
        >
          <svg
            width="32"
            height="34"
            viewBox="0 0 32 34"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 3h12c9 0 14 6 14 14S24 31 15 31H3V3Z"
              stroke="currentColor"
              strokeWidth="5"
              className="text-forest"
            />
            <path
              d="M3 17h11M14 8v18"
              stroke="currentColor"
              strokeWidth="3"
              className="text-forest"
            />
          </svg>
          <span className="text-xl font-extrabold tracking-[-0.04em] text-forest">
            DIRCOM<span className="text-forest-light">.</span>
          </span>
        </a>
        <div className="order-3 lg:order-0">
          <Navigation />
        </div>
        <div className="ml-auto flex items-center gap-2.5 border-l border-line pl-4 lg:ml-0">
          <Avatar employee={demoProfile} size={36} />
          <div className="hidden sm:block">
            <p className="text-xs font-bold">Valeria M.</p>
            <p className="mt-1 text-[10px] text-muted">Perfil de ejemplo</p>
          </div>
        </div>
      </div>
    </header>
  );
}
