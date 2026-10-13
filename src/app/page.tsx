import { IllustratedIcon, MessagesSquare } from "@/components/ui/icon";
import { Header } from "@/components/layout/header";
import { MainContainer } from "@/components/layout/main-container";
import { UserGreeting } from "@/components/layout/user-greeting";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { BirthdayFeatured } from "@/components/birthdays/birthday-featured";
import { EmployeeFeatured } from "@/components/employees/employee-featured";
import { VotingPodium } from "@/components/voting/voting-podium";
import { VotingPreview } from "@/components/voting/voting-preview";
import { ActivityBoard } from "@/components/activities/activity-board";
import { NewActivityPreview } from "@/components/activities/new-activity-preview";
import {
  activities,
  celebrations,
  DEMO_DATE,
  demoProfile,
  employees,
  recognition,
} from "@/data/mock-data";
import { getNextBirthday } from "@/lib/dates";

export default function Home() {
  const birthday = getNextBirthday(employees, celebrations, DEMO_DATE);
  return (
    <>
      <Header />
      <MainContainer>
        <UserGreeting profile={demoProfile} />
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
              description="Agrega los cumpleaños del equipo para destacar aquí el próximo."
            />
          )}
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
            <span className="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-semibold text-muted">
              Semana del 5 al 9 de octubre
            </span>
          </SectionHeading>
          <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
            <EmployeeFeatured recognition={recognition} />
            <VotingPodium places={recognition.podium} />
          </div>
          <VotingPreview />
        </section>
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
            <NewActivityPreview />
          </SectionHeading>
          <ActivityBoard activities={activities} />
        </section>
      </MainContainer>
    </>
  );
}
