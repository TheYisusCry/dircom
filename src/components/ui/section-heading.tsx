import type { ReactNode } from "react";

export function SectionHeading({
  id,
  title,
  subtitle,
  icon,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-forest/10 bg-mint text-forest-ink"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div>
          <h2
            id={id}
            className="text-xl font-bold tracking-tight sm:text-[24px]"
          >
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
