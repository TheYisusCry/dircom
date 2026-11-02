"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { IllustratedIcon, Sparkles } from "@/components/ui/icon";
import { recordConsentAction } from "@/app/actions/consent";
import { logoutAction } from "@/app/login/actions";
import { INITIAL_ACTION } from "@/types/database";
import { ConsentDocumentModal } from "./consent-document-modal";

interface WelcomeConsentModalProps {
  employee: {
    id: string;
    name: string;
  };
  hasAcceptedConsent: boolean;
}

export function WelcomeConsentModal({
  employee,
  hasAcceptedConsent,
}: WelcomeConsentModalProps) {
  const router = useRouter();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [hasReadDocument, setHasReadDocument] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [state, formAction, pending] = useActionState(recordConsentAction, INITIAL_ACTION);

  const welcomeOpen = !hasAcceptedConsent && state.status !== "success";

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  if (!welcomeOpen) {
    return null;
  }

  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!hasReadDocument) {
      e.preventDefault();
      setLegalModalOpen(true);
    } else {
      setConsentChecked((prev) => !prev);
    }
  };

  const handleLegalUnderstood = () => {
    setHasReadDocument(true);
    setConsentChecked(true);
    setLegalModalOpen(false);
  };

  return (
    <>
      <Modal
        open={welcomeOpen}
        onClose={() => {}}
        title="¡Bienvenido a DIRCOM Virtual!"
        maxWidth="max-w-xl"
        showCloseButton={false}
        closeOnClickOutside={false}
      >
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3.5 rounded-2xl bg-mint/50 border border-forest/15 p-4">
            <IllustratedIcon name="party" size={40} className="shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-forest-ink">
                ¡Qué alegría tenerte en el equipo, {employee.name.split(" ")[0]}!
              </h3>
              <p className="mt-0.5 text-xs text-muted leading-relaxed">
                Este es el espacio privado de DIRCOM para compartir fechas importantes, reconocimientos y actividades internas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-left">
            <div className="rounded-xl border border-line bg-mist/30 p-3">
              <div className="flex items-center gap-2">
                <IllustratedIcon name="cake" size={18} />
                <span className="text-xs font-bold text-ink">Cumpleaños</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-muted">
                Recordatorios y celebraciones especiales del equipo.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-mist/30 p-3">
              <div className="flex items-center gap-2">
                <IllustratedIcon name="trophy" size={18} />
                <span className="text-xs font-bold text-ink">Destacado</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-muted">
                Votaciones semanales anónimas entre compañeros.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-mist/30 p-3">
              <div className="flex items-center gap-2">
                <IllustratedIcon name="coffee" size={18} />
                <span className="text-xs font-bold text-ink">Café de Oficina</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-muted">
                Registro transparente de la cuota mensual de café.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-mist/30 p-3">
              <div className="flex items-center gap-2">
                <IllustratedIcon name="social" size={18} />
                <span className="text-xs font-bold text-ink">Actividades</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-muted">
                Planes rápidos y avisos informales del departamento.
              </p>
            </div>
          </div>

          {state.message && (
            <p
              role={state.status === "error" ? "alert" : "status"}
              className={`rounded-xl border p-3 text-xs leading-5 ${
                state.status === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-forest/20 bg-mint text-forest-ink"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="rounded-xl border border-line bg-white p-3.5 sm:p-4 text-xs text-muted shadow-sm">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={() => {}}
                onClick={handleCheckboxClick}
                disabled={pending}
                className="mt-0.5 size-4 rounded border-line text-forest focus:ring-forest cursor-pointer"
              />
              <span className="leading-5 text-[11px] sm:text-xs text-ink">
                He leído y doy mi consentimiento para el tratamiento de mis datos personales conforme a la{" "}
                <a
                  href="#consentimiento"
                  onClick={(e) => {
                    e.preventDefault();
                    setLegalModalOpen(true);
                  }}
                  className="font-bold text-forest underline hover:text-forest-ink"
                >
                  Información sobre consentimiento
                </a>.
              </span>
            </label>
            {!hasReadDocument && (
              <p className="mt-1 pl-6.5 text-[10px] text-muted">
                (Haz clic en el enlace para abrir y leer el documento legal antes de confirmar).
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" disabled={pending} className="w-full sm:w-auto text-muted">
                Cerrar sesión
              </Button>
            </form>

            <form action={formAction} className="w-full sm:w-auto">
              <Button
                type="submit"
                disabled={!consentChecked || pending}
                className="w-full sm:w-auto"
              >
                <Sparkles size={16} />
                <span>{pending ? "Guardando..." : "Gracias, comenzar"}</span>
              </Button>
            </form>
          </div>
        </div>
      </Modal>

      <ConsentDocumentModal
        open={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        employeeName={employee.name}
        onUnderstood={handleLegalUnderstood}
      />
    </>
  );
}
