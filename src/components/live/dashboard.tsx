"use client";
import { useCallback, useState } from "react";
import { IllustratedIcon, MessagesSquare } from "@/components/ui/icon";
import { MainContainer } from "@/components/layout/main-container";
import { UserGreeting } from "@/components/layout/user-greeting";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { NewAnnouncementModal } from "@/components/announcements/new-announcement-modal";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { BirthdayFeatured } from "@/components/birthdays/birthday-featured";
import { UpcomingBirthdaysList } from "@/components/birthdays/upcoming-birthdays-list";
import { EmployeeFeatured } from "@/components/employees/employee-featured";
import { VotingPodium } from "@/components/voting/voting-podium";
import { VotingStatus } from "@/components/voting/voting-status";
import { CelebrationConfetti } from "@/components/voting/celebration-confetti";
import { ActivityBoard } from "@/components/activities/activity-board";
import { NewActivityPreview } from "@/components/activities/new-activity-preview";
import { CoffeeSection } from "@/components/coffee/coffee-section";
import { ConsentViewerButton } from "@/components/consent/consent-viewer-button";
import { useDashboard, useRevelation } from "@/components/live/dashboard-live";
import type { DashboardData } from "@/lib/dashboard";
import type { Profile } from "@/types/database";

export function Dashboard({ initialData, profile }: { initialData: DashboardData; profile: Profile }) {
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const handleOpenAnnouncement = useCallback(() => setAnnouncementModalOpen(true), []);
  const handleCloseAnnouncement = useCallback(() => setAnnouncementModalOpen(false), []);
  const handleOpenActivity = useCallback(() => setActivityModalOpen(true), []);
  const { data, connection, stale } = useDashboard(initialData);
  const { birthday, upcomingBirthdays, allBirthdays, todayIso } = data.birthdays;
  const { activeRound, publishedRound, hasVoted, candidates } = data.voting;
  const { remaining, celebrationKey } = useRevelation(publishedRound, data.voting.serverNow);
  const activeRecognition = remaining > 0 ? null : data.voting.activeRecognition;
  const { realActivities } = data.activities;
  const { coffeeStatuses, coffeeLeaderboard, coffeeSummary } = data.coffee;
  const announcements = data.announcements?.announcements ?? [];
  return (
    <>
      <CelebrationConfetti triggerKey={celebrationKey} />
      <MainContainer>
        {(connection !== "connected" || stale) && <p role="status" className="mb-3 text-xs text-muted">{stale ? "Algunos datos no se pudieron actualizar. Reintentando…" : connection === "connecting" ? "Conectando actualizaciones en directo…" : "Reconectando actualizaciones. Los datos se comprueban periódicamente."}</p>}
        <UserGreeting
          profile={{ name: `${profile.first_name} ${profile.last_name}` }}
          announcements={announcements}
          onOpenCreateAnnouncement={handleOpenAnnouncement}
        />
        <section id="cumpleanos" aria-labelledby="birthday-heading">
          <SectionHeading
            id="birthday-heading"
            title="Próximo cumpleaños"
            subtitle="Una fecha especial para alguien de nuestro equipo."
            icon={<IllustratedIcon name="party" size={22} />}
          >
            <span className="flex items-center gap-2 text-[11px] text-muted">
              <span className="size-1.5 rounded-full bg-forest" />
              {birthday?.celebration
                ? "Celebración en agenda"
                : "Celebramos a nuestra gente"}
            </span>
          </SectionHeading>
          {birthday ? (
            <BirthdayFeatured birthday={birthday} />
          ) : (
            <EmptyState
              title="Próximos cumpleaños por descubrir"
              description="Registra los cumpleaños del equipo para destacar aquí el próximo."
            />
          )}
          <UpcomingBirthdaysList
            birthdays={upcomingBirthdays}
            allBirthdays={allBirthdays}
            todayIso={todayIso}
          />
        </section>
        <section
          id="destacado"
          aria-labelledby="employee-heading"
          className="mt-8 sm:mt-10"
        >
          <SectionHeading
            id="employee-heading"
            title="Empleado destacado"
            subtitle="Reconocemos el compromiso y las buenas ideas."
            icon={<IllustratedIcon name="trophy" size={22} />}
          >
            {activeRecognition && (
              <span className="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-semibold text-muted">
                {activeRecognition.weekLabel}
              </span>
            )}
          </SectionHeading>
          {remaining > 0 ? (
            <div className="panel p-8 text-center" role="status">
              <p className="text-sm font-semibold">El ganador se revela en</p>
              <p className="mt-2 text-4xl font-bold tabular-nums">{Math.ceil(remaining / 1000)}</p>
              <p className="mt-2 text-xs text-muted">Prepárate para celebrar con el equipo.</p>
            </div>
          ) : activeRecognition ? (
            <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
              <EmployeeFeatured recognition={activeRecognition} />
              <VotingPodium places={activeRecognition.podium} />
            </div>
          ) : (
            <EmptyState
              title={publishedRound && !activeRound ? "La ronda terminó sin votos" : "Votación de la semana por comenzar"}
              description={publishedRound && !activeRound ? "No se ha asignado un ganador en esta ronda." : "Cuando el administrador inicie y publique los resultados de la votación semanal, el podio y el empleado destacado se mostrarán aquí."}
            />
          )}
          {remaining === 0 && <VotingStatus
            activeRound={activeRound}
            hasVoted={hasVoted}
            candidates={candidates}
            isEmployee={profile.role === "employee"}
            winnerName={activeRecognition?.winner.name}
            weekLabel={activeRecognition?.weekLabel}
          />}
        </section>
        <CoffeeSection
          statuses={coffeeStatuses}
          leaderboard={coffeeLeaderboard}
          summary={coffeeSummary}
          isAdmin={profile.role === "admin"}
        />
        <section
          id="actividades"
          aria-labelledby="activity-heading"
          className="mt-8 sm:mt-10"
        >
          <SectionHeading
            id="activity-heading"
            title="Actividades rápidas"
            subtitle="Pequeños planes, grandes momentos juntos."
            icon={<MessagesSquare size={19} />}
          >
            <NewActivityPreview
              externalOpen={activityModalOpen}
              onOpenChange={setActivityModalOpen}
            />
          </SectionHeading>
          <ActivityBoard
            activities={realActivities}
            currentUserId={profile.id}
            isAdmin={profile.role === "admin"}
          />
        </section>
        <footer className="mt-12 border-t border-line py-6 text-center text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} DIRCOM. Espacio interno del equipo.</p>
          <ConsentViewerButton
            employeeName={`${profile.first_name} ${profile.last_name}`}
            variant="link"
          />
        </footer>
      </MainContainer>

      <FloatingActionButton
        onOpenAnnouncement={handleOpenAnnouncement}
        onOpenActivity={handleOpenActivity}
      />

      {announcementModalOpen && (
        <NewAnnouncementModal
          open={announcementModalOpen}
          onClose={handleCloseAnnouncement}
        />
      )}
    </>
  );
}
