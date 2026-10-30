import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { Header } from "@/components/layout/header";
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
      <main id="contenido" className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8">
        <div className="mb-7 flex flex-wrap items-center gap-3">
          <Link href="/admin" className="admin-link">
            Administración
          </Link>
          <span className="text-line">/</span>
          <Link href="/admin/empleados" className="admin-link">
            Empleados
          </Link>
          <span className="text-line">/</span>
          <Link href="/admin/cuenta" className="admin-link">
            Mi cuenta
          </Link>
        </div>
        {children}
      </main>
    </>
  );
}
