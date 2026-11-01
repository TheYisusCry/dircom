"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  PartyPopper,
  Vote,
  LockKeyhole,
  LayoutDashboard,
} from "@/components/ui/icon";

const items = [
  { href: "/admin", label: "General", icon: LayoutDashboard },
  { href: "/admin/empleados", label: "Empleados", icon: Users },
  { href: "/admin/cumpleanos", label: "Cumpleaños", icon: PartyPopper },
  { href: "/admin/votaciones", label: "Votaciones", icon: Vote },
  { href: "/admin/cuenta", label: "Mi cuenta", icon: LockKeyhole },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación del panel administrativo"
      className="no-scrollbar mb-7 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white p-1.5 shadow-xs"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              isActive
                ? "bg-mint text-forest-ink shadow-2xs font-bold"
                : "text-muted hover:bg-mist hover:text-ink"
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
