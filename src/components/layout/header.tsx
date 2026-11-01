import Link from "next/link";
import type { Profile } from "@/types/database";
import { avatarUrl } from "@/lib/auth/validation";
import { logoutAction } from "@/app/login/actions";
import { ArrowRight } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Navigation } from "./navigation";

export function Header({ profile }: { profile: Profile }) {
  const name = `${profile.first_name} ${profile.last_name}`;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="relative mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
        <Link
          href="/#inicio"
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
        </Link>
        <div className="order-3 lg:order-0">
          <Navigation profile={profile} />
        </div>
        <div className="ml-auto flex items-center gap-1.5 pl-1 sm:gap-2.5 sm:border-l sm:border-line sm:pl-4 lg:ml-0">
          <Link
            href={profile.role === "admin" ? "/admin/cuenta" : "/perfil"}
            className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-mist"
            title={profile.role === "admin" ? "Mi cuenta de administrador" : "Ajustes de mi perfil"}
          >
            <Avatar employee={{ name, photo: avatarUrl(profile) }} size={36} />
            <div className="hidden sm:block text-left">
              <p className="max-w-32 truncate text-xs font-bold text-ink" title={name}>
                {name}
              </p>
              <p className="mt-0.5 max-w-32 truncate text-[10px] text-muted">
                {profile.job_title ||
                  (profile.role === "admin" ? "Administrador" : "Equipo DIRCOM")}
              </p>
            </div>
          </Link>
          {profile.role === "admin" ? (
            <Link href="/admin" className="admin-link">
              Panel
            </Link>
          ) : (
            <Link href="/perfil" className="admin-link">
              Mi perfil
            </Link>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-forest-ink hover:bg-mint"
            >
              <ArrowRight size={18} />
              <span className="hidden xl:inline">Salir</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
