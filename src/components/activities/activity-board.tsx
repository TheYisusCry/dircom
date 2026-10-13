import type { Activity } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityCard } from "./activity-card";

export function ActivityBoard({
  activities,
}: {
  activities: readonly Activity[];
}) {
  if (!activities.length)
    return (
      <EmptyState
        title="El próximo plan puede ser tuyo"
        description="Cuando el equipo proponga actividades, aparecerán aquí."
      />
    );
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
