import { Header } from "@/components/layout/header";
import { Dashboard } from "@/components/live/dashboard";
import { requireProfile } from "@/lib/auth/session";
import { loadDashboard } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export default async function Home() {
  const profile = await requireProfile();
  const data = await loadDashboard(profile);
  return <><Header profile={profile} /><Dashboard initialData={data} profile={profile} /></>;
}
