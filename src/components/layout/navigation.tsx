"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Cake,
  Trophy,
  Coffee,
  MessagesSquare,
} from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/auth/validation";
import type { Profile } from "@/types/database";

const links = [
  { href: "#inicio", label: "Inicio", icon: LayoutDashboard },
  { href: "#cumpleanos", label: "Cumpleaños", icon: Cake },
  { href: "#destacado", label: "Empleado destacado", icon: Trophy },
  { href: "#cafe", label: "Café", icon: Coffee },
  { href: "#actividades", label: "Actividades", icon: MessagesSquare },
];

export function Navigation({ profile }: { profile?: Profile }) {
  const isDashboard = usePathname() === "/";
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#inicio");
  const name = profile ? `${profile.first_name} ${profile.last_name}` : "";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 },
    );
    links.forEach(({ href }) => {
      const element = document.querySelector(href);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar navegación" : "Abrir navegación"}
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
        className="flex size-11 items-center justify-center rounded-lg hover:bg-mist lg:hidden"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 top-[72px] z-30 bg-ink/20 backdrop-blur-2xs lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        id="main-navigation"
        aria-label="Navegación principal"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className={`${
          open ? "flex" : "hidden"
        } absolute inset-x-0 top-full z-40 flex-col gap-1.5 border-b border-t border-line bg-white p-4 shadow-xl lg:static lg:z-auto lg:flex lg:flex-row lg:border-0 lg:p-0 lg:shadow-none lg:gap-1`}
      >
        {profile && (
          <Link
            href={profile.role === "admin" ? "/admin/cuenta" : "/perfil"}
            onClick={() => setOpen(false)}
            className="mb-2 flex items-center justify-between rounded-xl border border-line bg-mist/60 p-3 hover:bg-mist lg:hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar employee={{ name, photo: avatarUrl(profile) }} size={38} />
              <div className="min-w-0 text-left">
                <p className="truncate text-xs font-bold text-ink">{name}</p>
                <p className="truncate text-[10px] text-muted">
                  {profile.job_title ||
                    (profile.role === "admin"
                      ? "Administrador"
                      : "Equipo DIRCOM")}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-forest-ink">
              Ajustes →
            </span>
          </Link>
        )}
        {links.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={isDashboard ? href : `/${href}`}
            aria-current={
              isDashboard && active === href ? "location" : undefined
            }
            onClick={() => {
              setActive(href);
              setOpen(false);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-3 text-[13px] font-semibold transition-colors lg:px-3 lg:py-2 ${
              active === href
                ? "bg-mint text-forest-ink"
                : "text-muted hover:bg-mist hover:text-ink"
            }`}
          >
            <Icon size={16} className="shrink-0 lg:hidden xl:inline" aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
