import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { VotingAdminManager } from "@/components/admin/voting-admin-manager";
import type { VotingRoundRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminVotacionesPage() {
  await requireAdmin();
  const admin = createAdminClient();

  // 1. Fetch active round (open or closed, but not published yet)
  const activeRoundRes = await admin
    .from("voting_rounds")
    .select("*")
    .in("status", ["open", "closed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const activeRound = activeRoundRes.data as VotingRoundRow | null;

  // 2. Count active employees eligible to vote
  const empCountRes = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "employee")
    .eq("is_active", true);

  const totalEmployees = empCountRes.count ?? 0;

  // 3. Count ballots cast if there is an active round
  let ballotsCount = 0;
  if (activeRound) {
    const ballotsRes = await admin
      .from("voting_ballots_cast")
      .select("voter_id", { count: "exact", head: true })
      .eq("round_id", activeRound.id);
    ballotsCount = ballotsRes.count ?? 0;
  }

  // 4. Fetch past published rounds
  const pastRoundsRes = await admin
    .from("voting_rounds")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  const pastRounds = (pastRoundsRes.data ?? []) as VotingRoundRow[];

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Votaciones y Reconocimiento</h1>
      <p className="mb-7 mt-2 text-sm text-muted">
        Abre votaciones programadas de 15 minutos, monitorea la participación y publica al ganador de la semana.
      </p>
      <VotingAdminManager
        activeRound={activeRound}
        pastRounds={pastRounds}
        totalEmployees={totalEmployees}
        ballotsCount={ballotsCount}
      />
    </>
  );
}
