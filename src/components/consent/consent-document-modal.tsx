"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LockKeyhole } from "@/components/ui/icon";

export function ConsentDocumentModal({
  open,
  onClose,
  employeeName,
  onUnderstood,
}: {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  onUnderstood?: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Consentimiento para el uso de datos personales"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 p-5 sm:p-6 text-sm leading-relaxed text-ink">
        <div className="rounded-xl bg-mist p-3.5 text-xs text-muted">
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <LockKeyhole size={14} className="text-forest" />
            Documento de protección de datos personales
          </p>
          <p className="mt-1">
            Por favor, lee detalladamente los términos de tratamiento y privacidad de tus datos dentro de la plataforma interna.
          </p>
        </div>

        <div className="max-h-[380px] space-y-3.5 overflow-y-auto pr-2 rounded-xl border border-line bg-mist/30 p-4 text-xs leading-6 sm:text-sm sm:leading-7 text-muted">
          <h3 className="font-bold uppercase tracking-wider text-ink text-center text-xs sm:text-sm">
            CONSENTIMIENTO PARA EL USO DE DATOS PERSONALES EN UN DASHBOARD INTERNO
          </h3>

          <p>
            Yo, <strong className="font-semibold text-ink">{employeeName}</strong>, declaro que he recibido información clara sobre el tratamiento de mis datos para el dashboard interno DIRCOM.
          </p>

          <p>
            Autorizo de manera libre, expresa e informada a <strong className="font-semibold text-ink">Ismael Jose Batista</strong>, con domicilio en <strong className="font-semibold text-ink">Santo Domingo, República Dominicana</strong> y contacto <strong className="font-semibold text-ink">ismaelfw2005@gmail.com</strong>, a recopilar y utilizar únicamente estos datos míos:
          </p>

          <ul className="list-disc pl-5 space-y-1 text-ink font-medium">
            <li>Nombre y apellidos.</li>
            <li>Fotografía.</li>
            <li>Día y mes de nacimiento, sin el año.</li>
            <li>Cargo o puesto.</li>
          </ul>

          <p>
            Los datos se usarán exclusivamente para identificarme y mostrar mi ficha dentro del dashboard interno de DIRCOM, accesible únicamente al personal del departamento de Comunicación y Mercadeo de la Universidad Nacional Pedro Henriquez Ureña. No se usarán para publicarlos en redes, publicidad, promoción, otros proyectos ni para tomar decisiones sobre sueldo, evaluación o continuidad laboral. No se recopilará mi sueldo ni mi año de nacimiento.
          </p>

          <p>
            Este dashboard es un proyecto independiente y no constituye una iniciativa, plataforma, actividad ni comunicación oficial de la Universidad, ni cuenta con su respaldo. La autorización que doy aquí se limita al uso descrito y no autoriza compartir mis datos con la Universidad ni con otras personas o entidades ajenas al grupo indicado.
          </p>

          <p>
            Puedo solicitar acceso a mis datos, su corrección o su eliminación, así como retirar este consentimiento, escribiendo a <a href="mailto:ismaelfw2005@gmail.com" className="font-semibold text-forest underline">ismaelfw2005@gmail.com</a>. Al recibir mi solicitud, se dejará de usar mi información y se eliminará del dashboard, salvo que exista una obligación legal de conservarla. Negarme a autorizar este uso o retirar mi consentimiento no afectará mi empleo ni mis condiciones laborales.
          </p>

          <p className="font-semibold text-ink">
            Declaro que pude leer este texto, hacer preguntas y decidir sin presión.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-line">
          <Button
            type="button"
            onClick={() => {
              if (onUnderstood) onUnderstood();
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 size={16} />
            <span>Leído y entendido</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
