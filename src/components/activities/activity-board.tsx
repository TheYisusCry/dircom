import type { Activity } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityCard } from "./activity-card";

export function ActivityBoard({
  activities,
  currentUserId,
  isAdmin,
}: {
  activities: readonly Activity[];
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  if (!activities.length)
    return (
      <EmptyState
        title="El próximo plan puede ser tuyo"
        description="Cuando el equipo proponga actividades, aparecerán aquí."
      />
    );

  const sorted = [...activities].sort((a, b) => {
    if (a.status === b.status) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.status === "open" ? -1 : 1;
  });

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
