import Image from "next/image";
import type { Employee } from "@/types";

export function Avatar({
  employee,
  size = 36,
  className = "",
}: {
  employee: Employee;
  size?: number;
  className?: string;
}) {
  const initials = employee.name
    .split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-mint text-xs font-bold text-forest-ink ${className}`}
      style={{ width: size, height: size }}
    >
      {employee.photo ? (
        <Image
          src={employee.photo}
          fill
          sizes={`${size}px`}
          alt={`Retrato de ${employee.name}`}
          className="object-cover"
        />
      ) : (
        <span aria-label={employee.name}>{initials}</span>
      )}
    </span>
  );
}
