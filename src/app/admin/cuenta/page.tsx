import { requireAdmin } from "@/lib/auth/session";
import { AdministratorPasswordForm } from "@/components/admin/administrator-password-form";

export default async function AdministratorAccountPage() {
  const profile = await requireAdmin();
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Mi cuenta</h1>
      <p className="mt-2 text-sm text-muted">
        Gestiona la contraseña de tu cuenta administradora.
      </p>
      <section
        className="panel mt-7 max-w-xl p-5 sm:p-8"
        aria-labelledby="admin-password-title"
      >
        <p className="text-sm font-bold">
          {profile.first_name} {profile.last_name}
        </p>
        <p className="mt-1 text-xs text-muted">Usuario: {profile.username}</p>
        <h2 id="admin-password-title" className="mb-5 mt-7 text-lg font-bold">
          Cambiar mi contraseña
        </h2>
        <AdministratorPasswordForm />
      </section>
    </>
  );
}
