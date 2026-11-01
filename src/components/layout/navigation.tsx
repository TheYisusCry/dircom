"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/auth/validation";
import type { Profile } from "@/types/database";

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#cumpleanos", label: "Cumpleaños" },
  { href: "#destacado", label: "Empleado destacado" },
  { href: "#actividades", label: "Actividades" },
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
      <nav
        id="main-navigation"
        aria-label="Navegación principal"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full z-40 flex-col gap-1.5 border-b border-t border-line bg-white p-4 shadow-xl lg:static lg:z-auto lg:flex lg:flex-row lg:border-0 lg:p-0 lg:shadow-none`}
      >
        {profile && (
          <div className="mb-2 flex items-center gap-3 border-b border-line pb-3 lg:hidden">
            <Avatar employee={{ name, photo: avatarUrl(profile) }} size={38} />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink">{name}</p>
              <p className="truncate text-[10px] text-muted">
                {profile.job_title ||
                  (profile.role === "admin"
                    ? "Administrador"
                    : "Equipo DIRCOM")}
              </p>
            </div>
          </div>
        )}
        {links.map(({ href, label }) => (
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
            className={`rounded-lg px-3.5 py-3 text-[13px] font-semibold transition-colors ${active === href ? "bg-mint text-forest-ink" : "text-muted hover:bg-mist hover:text-ink"}`}
          >
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}
