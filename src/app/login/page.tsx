import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { IllustratedIcon } from "@/components/ui/icon";
import { getSessionProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  const configured = isSupabaseConfigured();
  if (configured && (await getSessionProfile())) redirect("/");
  return (
    <main
      id="contenido"
      className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-5 sm:py-12"
    >
      <div className="grid w-full max-w-[950px] gap-6 lg:grid-cols-2">
        <div className="relative hidden flex-col justify-center overflow-hidden rounded-[28px] border border-forest/15 bg-mint p-10 lg:flex">
          <IllustratedIcon name="party" size={72} />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-forest-ink">
            Nuestro punto de encuentro
          </p>
          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-forest-ink">
            Las buenas ideas
            <br />
            empiezan en equipo.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted">
            Cumpleaños, reconocimiento y pequeños planes que hacen más cercana
            nuestra oficina.
          </p>
        </div>
        <div className="panel p-5 sm:p-10">
          <p className="text-2xl font-extrabold tracking-tight text-forest">
            DIRCOM.
          </p>
          <h1 className="mt-7 text-2xl font-bold tracking-tight">
            Qué gusto verte <IllustratedIcon name="sparkles" size={23} />
          </h1>
          <p className="mt-2 text-sm text-muted">
            Entra con tu usuario y contraseña.
          </p>
          <LoginForm configured={configured} />
        </div>
      </div>
    </main>
  );
}
