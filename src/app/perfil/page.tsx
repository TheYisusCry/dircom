import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { Header } from "@/components/layout/header";
import { MainContainer } from "@/components/layout/main-container";
import { Avatar } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/auth/validation";
import { MONTH_NAMES } from "@/lib/dates";
import { EmployeeResignation } from "@/components/profile/employee-resignation";
import { CalendarDays, ArrowRight } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage() {
  const profile = await requireProfile();

  if (profile.role === "admin") {
    redirect("/admin/cuenta");
  }

  const fullName = `${profile.first_name} ${profile.last_name}`;
  const birthdayText =
    profile.birthday_day && profile.birthday_month
      ? `${profile.birthday_day} de ${MONTH_NAMES[profile.birthday_month - 1]}`
      : "Sin fecha registrada";

  return (
    <>
      <Header profile={profile} />
      <MainContainer>
        <div className="pt-6 sm:pt-8">
          <nav aria-label="Miga de pan" className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
            >
              <span className="rotate-180 inline-block">
                <ArrowRight size={14} />
              </span>
              Volver al inicio
            </Link>
          </nav>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Ajustes de perfil
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Consulta tu información de empleado y gestiona el estado de tu cuenta en DIRCOM.
          </p>

          <div className="mt-6 space-y-6">
            {/* Tarjeta de información del perfil */}
            <section
              aria-labelledby="perfil-info-title"
              className="panel p-5 sm:p-7"
            >
              <h2 id="perfil-info-title" className="sr-only">
                Información de perfil
              </h2>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar
                  employee={{
                    name: fullName,
                    photo: avatarUrl(profile),
                  }}
                  size={72}
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-ink sm:text-xl">
                      {fullName}
                    </h3>
                    <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-semibold text-forest-ink">
                      Activo
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Usuario: <strong className="font-semibold text-ink">@{profile.username}</strong>
                  </p>
                  <p className="text-xs text-forest-ink font-medium">
                    {profile.job_title || "Empleado de DIRCOM"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                <div className="rounded-xl bg-mist p-3.5">
                  <span className="text-[11px] font-medium text-muted">
                    Puesto actual
                  </span>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {profile.job_title || "Sin cargo asignado"}
                  </p>
                </div>

                <div className="rounded-xl bg-mist p-3.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                    <CalendarDays size={14} />
                    Cumpleaños
                  </span>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {birthdayText}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-muted">
                La información personal, el cargo y la fotografía son gestionados por el área de administración.
              </p>
            </section>

            {/* Zona de la cuenta y renuncia */}
            <section
              aria-labelledby="zona-cuenta-title"
              className="panel p-5 sm:p-7"
            >
              <h2 id="zona-cuenta-title" className="text-base font-bold text-ink">
                Ajustes de la cuenta
              </h2>
              <p className="mt-1 text-xs text-muted">
                Opciones relativas a tu pertenencia al equipo y acceso a DIRCOM.
              </p>

              <div className="mt-5">
                <EmployeeResignation />
              </div>
            </section>
          </div>
        </div>
      </MainContainer>
    </>
  );
}
