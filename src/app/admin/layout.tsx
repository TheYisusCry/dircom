import { requireAdmin } from "@/lib/auth/session";
import { Header } from "@/components/layout/header";
import { AdminNav } from "@/components/admin/admin-nav";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  return (
    <>
      <Header profile={profile} />
      <main id="contenido" className="mx-auto max-w-[1240px] px-4 py-6 sm:px-8 sm:py-8">
        <AdminNav />
        {children}
      </main>
    </>
  );
}
