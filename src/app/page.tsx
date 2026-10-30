import { IllustratedIcon, MessagesSquare } from "@/components/ui/icon";
import { Header } from "@/components/layout/header";
import { MainContainer } from "@/components/layout/main-container";
import { UserGreeting } from "@/components/layout/user-greeting";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { BirthdayFeatured } from "@/components/birthdays/birthday-featured";
import { BirthdayMonthList } from "@/components/birthdays/birthday-month-list";
import { EmployeeFeatured } from "@/components/employees/employee-featured";
import { VotingPodium } from "@/components/voting/voting-podium";
import { VotingStatus } from "@/components/voting/voting-status";
import { CelebrationConfetti } from "@/components/voting/celebration-confetti";
import { ActivityBoard } from "@/components/activities/activity-board";
import { NewActivityPreview } from "@/components/activities/new-activity-preview";
import {
  celebrations as demoCelebrations,
  DEMO_DATE,
  employees as demoEmployees,
  recognition as demoRecognition,
} from "@/data/mock-data";
import {
  celebrationRowToCelebration,
  getBirthdaysOfMonth,
  getNextBirthday,
  getOfficeCurrentDate,
  profileToEmployee,
} from "@/lib/dates";
import { requireProfile } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import type { Activity, Employee, PodiumPlace, WeeklyRecognition } from "@/types";
import type { VotingRoundRow } from "@/types/database";

function profileToParticipant(p?: {
  id?: string;
  first_name?: string;
  last_name?: string;
  job_title?: string | null;
  avatar_path?: string | null;
} | null): Employee {
  return {
    id: p?.id ?? "unknown",
    name: p?.first_name
      ? `${p.first_name} ${p.last_name ?? ""}`.trim()
      : "Compañero DIRCOM",
    role: p?.job_title || "Equipo DIRCOM",
    photo: p?.avatar_path ? `/api/avatars/${p.id}` : undefined,
    birthday: { day: 1, month: 1 },
  };
}

export const dynamic = "force-dynamic";
export default async function Home() {
  const profile = await requireProfile();
  const supabase = await createSessionClient();

  const [
    profilesRes,
    celebrationsRes,
    activeRoundRes,
    publishedRoundRes,
    candidatesRes,
    activitiesRes,
  ] = await Promise.all([
    supabase
      .from("employee_directory")
      .select("*")
      .not("birthday_day", "is", null)
      .not("birthday_month", "is", null),
    supabase.from("birthday_celebrations").select("*"),
    supabase
      .from("voting_rounds")
      .select("*")
      .in("status", ["open", "closed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("voting_rounds")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("employee_directory")
      .select("id, first_name, last_name, job_title, avatar_path")
      .neq("id", profile.id)
      .order("first_name"),
    supabase
      .from("activities")
      .select(`
        id,
        title,
        category,
        description,
        status,
        created_at,
        creator:profiles!activities_creator_id_fkey(id, first_name, last_name, job_title, avatar_path),
        messages:activity_messages(
          id,
          text,
          created_at,
          author:profiles!activity_messages_author_id_fkey(id, first_name, last_name, job_title, avatar_path)
        )
      `)
      .order("created_at", { ascending: false }),
  ]);

  const dbEmployees = (profilesRes.data ?? [])
    .map(profileToEmployee)
    .filter((e): e is Employee => e !== null);

  const dbCelebrations = (celebrationsRes.data ?? []).map(
    celebrationRowToCelebration,
  );

  const useRealData = dbEmployees.length > 0;
  const activeEmployees = useRealData ? dbEmployees : demoEmployees;
  const activeCelebrations = useRealData ? dbCelebrations : demoCelebrations;

  const { todayIso, currentMonth, currentYear } = getOfficeCurrentDate();
  const refDate = useRealData ? todayIso : DEMO_DATE;
  const birthday = getNextBirthday(activeEmployees, activeCelebrations, refDate);
  const monthBirthdays = getBirthdaysOfMonth(
    activeEmployees,
    useRealData ? currentMonth : 10,
  );

  // Voting state and recognition
  const activeRound = activeRoundRes.data as VotingRoundRow | null;
  const publishedRound = publishedRoundRes.data as VotingRoundRow | null;

  let hasVoted = false;
  if (activeRound && profile.role === "employee") {
    const ballotCheck = await supabase
      .from("voting_ballots_cast")
      .select("voter_id")
      .eq("round_id", activeRound.id)
      .maybeSingle();
    hasVoted = Boolean(ballotCheck.data);
  }

  const candidates = (candidatesRes.data ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    role: c.job_title ?? "Equipo DIRCOM",
    photo: c.avatar_path ? `/api/avatars/${c.id}` : undefined,
  }));

  // Build podium & recognition from published round if available
  let activeRecognition: WeeklyRecognition = demoRecognition;
  if (
    publishedRound &&
    Array.isArray(publishedRound.podium) &&
    publishedRound.podium.length > 0
  ) {
    const realPodium: PodiumPlace[] = publishedRound.podium.map((p) => ({
      position: p.position,
      employee: {
        id: p.employee_id,
        name: p.employee_name,
        role: p.employee_role,
        photo: p.employee_photo,
        birthday: { day: 1, month: 1 },
      },
      recognition: p.recognition,
    }));

    activeRecognition = {
      weekLabel: publishedRound.week_label,
      winner: realPodium[0]?.employee ?? demoRecognition.winner,
      message:
        "Por su compromiso diario, compañerismo y dedicación. ¡Gracias por hacer que DIRCOM llegue más lejos!",
      podium: realPodium.length >= 3 ? realPodium : demoRecognition.podium,
    };
  }

  type RawProfile = {
    id?: string;
    first_name?: string;
    last_name?: string;
    job_title?: string | null;
    avatar_path?: string | null;
  };

  type RawActivity = {
    id: string;
    title: string;
    category: "food" | "coffee" | "social";
    description: string;
    status: "open" | "closed";
    created_at: string;
    creator?: RawProfile | RawProfile[] | null;
    messages?: Array<{
      id: string;
      text: string;
      created_at: string;
      author?: RawProfile | RawProfile[] | null;
    }> | null;
  };

  const rawActivities =
    (activitiesRes.data as unknown as RawActivity[] | null) ?? [];

  const realActivities: Activity[] = rawActivities.map((row) => {
    const rawCreator = Array.isArray(row.creator)
      ? row.creator[0]
      : row.creator;
    const rawMessages = Array.isArray(row.messages) ? row.messages : [];
    return {
      id: row.id,
      title: row.title,
      category: (["food", "coffee", "social"].includes(row.category)
        ? row.category
        : "food") as "food" | "coffee" | "social",
      description: row.description,
      status: row.status as "open" | "closed",
      createdAt: row.created_at,
      creator: profileToParticipant(rawCreator),
      messages: rawMessages
        .map((m) => {
          const rawAuthor = Array.isArray(m.author)
            ? m.author[0]
            : m.author;
          return {
            id: m.id,
            text: m.text,
            sentAt: m.created_at,
            author: profileToParticipant(rawAuthor),
          };
        })
        .sort(
          (a, b) =>
            new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        ),
    };
  });

  return (
    <>
      <CelebrationConfetti triggerKey={publishedRound?.id ?? ""} />
      <Header profile={profile} />
      <MainContainer>
        <UserGreeting
          profile={{ name: `${profile.first_name} ${profile.last_name}` }}
        />
        <p className="mb-5 text-[11px] text-muted">
          El perfil, cumpleaños, votaciones y actividades son reales. ¡Tu plataforma DIRCOM está 100% conectada!
        </p>
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
          <BirthdayMonthList
            employees={monthBirthdays}
            celebrations={activeCelebrations}
            currentMonth={useRealData ? currentMonth : 10}
            currentYear={useRealData ? currentYear : 2026}
            todayIso={refDate}
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
            <span className="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-semibold text-muted">
              {activeRecognition.weekLabel}
            </span>
          </SectionHeading>
          <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
            <EmployeeFeatured recognition={activeRecognition} />
            <VotingPodium places={activeRecognition.podium} />
          </div>
          <VotingStatus
            activeRound={activeRound}
            hasVoted={hasVoted}
            candidates={candidates}
            isEmployee={profile.role === "employee"}
            winnerName={activeRecognition.winner.name}
            weekLabel={activeRecognition.weekLabel}
          />
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
          <ActivityBoard
            activities={realActivities}
            currentUserId={profile.id}
            isAdmin={profile.role === "admin"}
          />
        </section>
      </MainContainer>
    </>
  );
}
