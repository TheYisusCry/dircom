import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { Header } from "@/components/layout/header";
import { LockKeyhole } from "@/components/ui/icon";
export const dynamic = "force-dynamic";
export default async function AccessDeniedPage() {
  const profile = await requireProfile();
  return (
    <>
      <Header profile={profile} />
      <main id="contenido" className="mx-auto max-w-lg px-5 py-16">
        <div className="panel p-8 text-center">
          <LockKeyhole className="text-forest" size={36} />
          <h1 className="mt-5 text-2xl font-bold">Acceso reservado</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Este espacio es exclusivo del administrador. Tu dashboard sigue
            disponible.
          </p>
          <Link href="/" className="admin-link mt-5 inline-flex">
            Volver al inicio
          </Link>
        </div>
      </main>
    </>
  );
}
