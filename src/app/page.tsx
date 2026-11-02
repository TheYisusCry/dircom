import { Header } from "@/components/layout/header";
import { Dashboard } from "@/components/live/dashboard";
import { WelcomeConsentModal } from "@/components/consent/welcome-consent-modal";
import { requireProfile } from "@/lib/auth/session";
import { loadDashboard } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export default async function Home() {
  const profile = await requireProfile();
  const data = await loadDashboard(profile);
  return (
    <>
      <Header profile={profile} />
      <Dashboard initialData={data} profile={profile} />
      {profile.role === "employee" && (
        <WelcomeConsentModal
          employee={{
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
          }}
          hasAcceptedConsent={Boolean(profile.consent_accepted_at)}
        />
      )}
    </>
  );
}
