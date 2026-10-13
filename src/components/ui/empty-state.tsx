import { Sprout } from "@/components/ui/icon";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
      <Sprout
        className="mx-auto mb-3 text-forest-ink"
        size={28}
        aria-hidden="true"
      />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
