import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateEmployeeCoffeeStatus,
  buildCoffeeLeaderboard,
  calculateCoffeeOfficeSummary,
} from "@/lib/coffee";
import {
  celebrationRowToCelebration,
  getUpcomingBirthdays,
  getNextBirthday,
  getOfficeCurrentDate,
  profileToEmployee,
  profileToParticipant,
} from "@/lib/dates";
import type {
  CoffeeDeliveryRow,
  CoffeeLeaderboardEntry,
  CoffeeOfficeSummary,
  EmployeeCoffeeStatus,
} from "@/types/coffee";
import type {
  Activity,
  Announcement,
  BirthdayPresentation,
  Employee,
  PodiumPlace,
  WeeklyRecognition,
} from "@/types";
import type { Profile, VotingRoundRow } from "@/types/database";

export type DashboardScope =
  | "birthdays"
  | "voting"
  | "activities"
  | "coffee"
  | "announcements";

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
  message_count?: Array<{ count: number }>;
  messages?: Array<{
    id: string;
    text: string;
    created_at: string;
    author?: RawProfile | RawProfile[] | null;
  }> | null;
};

export async function loadDashboard(profile: Profile, scope?: DashboardScope) {
  async function run<T>(
    section: DashboardScope,
    query: () => PromiseLike<T>,
  ): Promise<T | { data: null; error: null }> {
    return !scope || section === scope
      ? await query()
      : { data: null, error: null };
  }

  const supabase = await createSessionClient();
  // Only called after requireProfile/getSessionProfile in the page/API routes.
  // These server-only views expose active employees' presentation fields; all
  // other dashboard reads retain the caller's session and row-level policies.
  const directory = createAdminClient();

  const [
    profilesRes,
    celebrationsRes,
    activeRoundRes,
    publishedRoundRes,
    candidatesRes,
    ballotsRes,
    activitiesRes,
    coffeeMembersRes,
    coffeeDeliveriesRes,
    announcementsRes,
  ] = await Promise.all([
    run("birthdays", () =>
      supabase
        .from("employee_directory")
        .select("*")
        .not("birthday_day", "is", null)
        .not("birthday_month", "is", null),
    ),
    run("birthdays", () => supabase.from("birthday_celebrations").select("*")),
    run("voting", () =>
      supabase
        .from("voting_rounds")
        .select("*")
        .in("status", ["open", "closed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    run("voting", () =>
      supabase
        .from("voting_rounds")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    run("voting", () =>
      directory
        .from("active_employees")
        .select("id, first_name, last_name, job_title, avatar_path")
        .neq("id", profile.id)
        .order("first_name"),
    ),
    run("voting", async () => {
      if (profile.role !== "employee") return { data: [], error: null };
      const res = await supabase.from("voting_ballots_cast").select("round_id");
      return { data: res.data ?? [], error: res.error };
    }),
    run("activities", () =>
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
          message_count:activity_messages(count),
          messages:activity_messages(
            id,
            text,
            created_at,
            author:profiles!activity_messages_author_id_fkey(id, first_name, last_name, job_title, avatar_path)
          )
        `)
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "messages", ascending: false })
        .order("id", { referencedTable: "messages", ascending: false })
        .limit(3, { referencedTable: "messages" }),
    ),
    run("coffee", () =>
      directory
        .from("coffee_members")
        .select("id, first_name, last_name, job_title, avatar_path, created_at")
        .order("first_name"),
    ),
    run("coffee", () =>
      supabase
        .from("coffee_deliveries")
        .select("*")
        .order("delivery_date", { ascending: false }),
    ),
    run("announcements", () =>
      supabase
        .from("announcements")
        .select("id, title, description, tone, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ),
  ]);

  for (const result of [
    profilesRes,
    celebrationsRes,
    activeRoundRes,
    publishedRoundRes,
    candidatesRes,
    ballotsRes,
    activitiesRes,
    coffeeMembersRes,
    coffeeDeliveriesRes,
    announcementsRes,
  ]) {
    if (result.error) {
      throw new Error("No se pudieron actualizar los datos del tablero.");
    }
  }

  const { todayIso, currentMonth, currentYear } = getOfficeCurrentDate();

  // 1. Birthdays section
  let birthday: BirthdayPresentation | null = null;
  let upcomingBirthdays: BirthdayPresentation[] = [];
  let allBirthdays: BirthdayPresentation[] = [];

  if (!scope || scope === "birthdays") {
    const dbEmployees = (profilesRes.data ?? [])
      .map(profileToEmployee)
      .filter((e): e is Employee => e !== null);

    const dbCelebrations = (celebrationsRes.data ?? []).map(
      celebrationRowToCelebration,
    );

    birthday = getNextBirthday(dbEmployees, dbCelebrations, todayIso) ?? null;
    upcomingBirthdays = getUpcomingBirthdays(dbEmployees, dbCelebrations, todayIso, 3);
    allBirthdays = getUpcomingBirthdays(dbEmployees, dbCelebrations, todayIso);
  }

  // 2. Voting state and recognition
  let activeRound: VotingRoundRow | null = null;
  let publishedRound: VotingRoundRow | null = null;
  let hasVoted = false;
  let candidates: Array<{ id: string; name: string; role: string; photo?: string }> = [];
  let activeRecognition: WeeklyRecognition | null = null;

  if (!scope || scope === "voting") {
    activeRound = activeRoundRes.data as VotingRoundRow | null;
    publishedRound = publishedRoundRes.data as VotingRoundRow | null;

    if (activeRound && profile.role === "employee") {
      const castRoundIds = new Set(
        ((ballotsRes.data as Array<{ round_id: string }> | null) ?? []).map(
          (b) => b.round_id,
        ),
      );
      hasVoted = castRoundIds.has(activeRound.id);
    }

    candidates = (candidatesRes.data ?? []).map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      role: c.job_title ?? "Equipo DIRCOM",
      photo: c.avatar_path ? `/api/avatars/${c.id}` : undefined,
    }));

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

      if (realPodium.length > 0) {
        activeRecognition = {
          weekLabel: publishedRound.week_label,
          winner: realPodium[0]?.employee ?? {
            id: "winner",
            name: "Empleado Destacado",
            role: "Equipo DIRCOM",
            birthday: { day: 1, month: 1 },
          },
          message:
            "Por su compromiso diario, compañerismo y dedicación. ¡Gracias por hacer que DIRCOM llegue más lejos!",
          podium: realPodium,
        };
      }
    }
  }

  // 3. Activities section
  let realActivities: Activity[] = [];

  if (!scope || scope === "activities") {
    const rawActivities =
      (activitiesRes.data as unknown as RawActivity[] | null) ?? [];

    realActivities = rawActivities.map((row) => {
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
        messageCount: row.message_count?.[0]?.count ?? rawMessages.length,
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
  }

  // 4. Coffee section
  let coffeeStatuses: EmployeeCoffeeStatus[] = [];
  let coffeeLeaderboard: CoffeeLeaderboardEntry[] = [];
  let coffeeSummary: CoffeeOfficeSummary = {
    currentMonthLabel: "",
    totalEmployees: 0,
    upToDateCount: 0,
    pendingCount: 0,
    officeTotalPackages: 0,
    progressPercentage: 0,
    currentYear,
    currentMonth,
  };

  if (!scope || scope === "coffee") {
    const rawCoffeeMembers = (coffeeMembersRes.data ?? []) as Array<{
      id: string;
      first_name: string;
      last_name: string;
      job_title: string | null;
      avatar_path: string | null;
      created_at: string;
    }>;
    const rawCoffeeDeliveries =
      (coffeeDeliveriesRes.data ?? []) as CoffeeDeliveryRow[];

    coffeeStatuses = rawCoffeeMembers.map((emp) =>
      calculateEmployeeCoffeeStatus(
        emp,
        rawCoffeeDeliveries,
        currentYear,
        currentMonth,
      ),
    );
    coffeeLeaderboard = buildCoffeeLeaderboard(
      coffeeStatuses,
      rawCoffeeDeliveries,
    );
    coffeeSummary = calculateCoffeeOfficeSummary(
      coffeeStatuses,
      currentYear,
      currentMonth,
    );
  }

  // 5. Announcements section
  let announcements: Announcement[] = [];

  if (!scope || scope === "announcements") {
    const rawAnnouncements = (announcementsRes.data ?? []) as Array<{
      id: string;
      title: string;
      description: string | null;
      tone: "urgent" | "coffee" | "general" | "celebration";
      created_at: string;
    }>;

    announcements = rawAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      tone: a.tone,
      createdAt: a.created_at,
    }));
  }

  return {
    birthdays: { birthday, upcomingBirthdays, allBirthdays, todayIso },
    voting: {
      activeRound,
      publishedRound,
      hasVoted,
      candidates,
      activeRecognition,
      serverNow: Date.now(),
    },
    activities: { realActivities },
    coffee: { coffeeStatuses, coffeeLeaderboard, coffeeSummary },
    announcements: { announcements },
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
