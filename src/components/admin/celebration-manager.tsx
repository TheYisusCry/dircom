"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  CalendarDays,
  CalendarClock,
  Clock3,
  MapPin,
  PartyPopper,
  Plus,
} from "@/components/ui/icon";
import { formatCalendarDate, formatEventDate, formatTime } from "@/lib/dates";
import { avatarUrl } from "@/lib/auth/validation";
import { saveCelebration, deleteCelebration } from "@/app/admin/cumpleanos/actions";
import {
  INITIAL_ACTION,
  type ActionState,
  type BirthdayCelebrationRow,
  type Profile,
} from "@/types/database";

export type CelebrationWithEmployee = BirthdayCelebrationRow & {
  employee: Profile;
};

function Feedback({ state }: { state: ActionState }) {
  const router = useRouter();
  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);
  return state.message ? (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={`rounded-xl border p-4 text-sm leading-6 ${
        state.status === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-forest/20 bg-mint text-forest-ink"
      }`}
    >
      {state.message}
    </p>
  ) : null;
}

export function CelebrationManager({
  celebrations,
  employees,
}: {
  celebrations: CelebrationWithEmployee[];
  employees: Profile[];
}) {
  const [modalMode, setModalMode] = useState<
    | { type: "edit"; celebration: CelebrationWithEmployee }
    | { type: "create" }
    | { type: "delete"; celebration: CelebrationWithEmployee }
    | null
  >(null);

  const close = () => setModalMode(null);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted">
            {celebrations.length === 1
              ? "1 celebración registrada"
              : `${celebrations.length} celebraciones registradas`}
          </p>
        </div>
        <Button onClick={() => setModalMode({ type: "create" })}>
          <Plus size={18} />
          Programar celebración
        </Button>
      </div>

      {celebrations.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center p-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-mint text-forest-ink">
            <PartyPopper size={30} />
          </span>
          <h3 className="mt-4 text-base font-bold">No hay celebraciones programadas</h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
            Programa el festejo del próximo cumpleaños de la oficina para que todo el equipo vea los detalles en el tablero principal.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => setModalMode({ type: "create" })}
          >
            <Plus size={16} />
            Programar ahora
          </Button>
        </div>
      ) : (
        <div className="grid gap-5">
          {celebrations.map((item) => {
            const empName = `${item.employee.first_name} ${item.employee.last_name}`;
            return (
              <article
                key={item.id}
                className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <Avatar
                    employee={{
                      name: empName,
                      photo: avatarUrl(item.employee),
                    }}
                    size={52}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold">{item.title}</h2>
                      <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-semibold text-forest-ink">
                        Agasajado: {empName}
                      </span>
                    </div>

                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">
                      {item.invitation}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock size={16} className="text-forest" />
                        {formatEventDate(item.starts_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={16} className="text-forest" />
                        {formatTime(item.starts_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-forest" />
                        {item.location}
                      </span>
                      {item.employee.birthday_day && item.employee.birthday_month && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={16} className="text-muted" />
                          Cumpleaños:{" "}
                          {formatCalendarDate(
                            `2026-${String(item.employee.birthday_month).padStart(2, "0")}-${String(
                              item.employee.birthday_day,
                            ).padStart(2, "0")}`,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 border-t border-line pt-4 sm:border-0 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setModalMode({ type: "edit", celebration: item })}
                    className="admin-link text-xs"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode({ type: "delete", celebration: item })}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {(modalMode?.type === "create" || modalMode?.type === "edit") && (
        <CelebrationFormModal
          mode={modalMode}
          employees={employees}
          onClose={close}
        />
      )}

      {/* Modal Confirmar Eliminar */}
      {modalMode?.type === "delete" && (
        <DeleteCelebrationModal
          celebration={modalMode.celebration}
          onClose={close}
        />
      )}
    </>
  );
}

function CelebrationFormModal({
  mode,
  employees,
  onClose,
}: {
  mode: { type: "create" } | { type: "edit"; celebration: CelebrationWithEmployee };
  employees: Profile[];
  onClose: () => void;
}) {
  const celebration = mode.type === "edit" ? mode.celebration : undefined;
  const [state, formAction, pending] = useActionState(saveCelebration, INITIAL_ACTION);

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => onClose(), 800);
      return () => clearTimeout(timer);
    }
  }, [state.status, onClose]);

  // Convert starts_at to datetime-local format (YYYY-MM-DDTHH:mm)
  const defaultDateTime = celebration
    ? new Date(celebration.starts_at).toISOString().slice(0, 16)
    : "";

  return (
    <Modal
      open
      onClose={onClose}
      title={celebration ? "Editar celebración" : "Programar nueva celebración"}
    >
      <form action={formAction} className="space-y-4 p-6">
        <Feedback state={state} />

        {celebration && <input type="hidden" name="id" value={celebration.id} />}

        <fieldset disabled={pending} className="space-y-4">
          <label className="form-label">
            Empleado agasajado
            <select
              name="employee_id"
              required
              defaultValue={celebration?.employee_id ?? ""}
              className="auth-input mt-2"
            >
              <option value="" disabled>
                Selecciona un empleado...
              </option>
              {employees.map((emp) => {
                const bdayInfo =
                  emp.birthday_day && emp.birthday_month
                    ? ` (Cumple: ${emp.birthday_day}/${emp.birthday_month})`
                    : " (Sin fecha de cumpleaños)";
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                    {bdayInfo}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="form-label">
            Título de la celebración
            <input
              name="title"
              required
              minLength={3}
              maxLength={100}
              placeholder="Por ejemplo: ¡Celebremos a Ismael!"
              defaultValue={celebration?.title ?? ""}
              className="auth-input mt-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-label">
              Fecha y hora del festejo
              <input
                type="datetime-local"
                name="starts_at"
                required
                defaultValue={defaultDateTime}
                className="auth-input mt-2"
              />
              <span className="mt-1 block text-[10px] text-muted">
                Hora oficial de Bolivia (UTC-4)
              </span>
            </label>

            <label className="form-label">
              Lugar del encuentro
              <input
                name="location"
                required
                minLength={3}
                maxLength={150}
                placeholder="Por ejemplo: Sala de encuentros · DIRCOM"
                defaultValue={celebration?.location ?? "Sala de encuentros · Oficina DIRCOM"}
                className="auth-input mt-2"
              />
            </label>
          </div>

          <label className="form-label">
            Mensaje o invitación
            <textarea
              name="invitation"
              required
              rows={4}
              minLength={5}
              maxLength={1500}
              placeholder="Escribe el mensaje o palabras para el equipo..."
              defaultValue={
                celebration?.invitation ??
                "Nos reuniremos para celebrar juntos antes del fin de semana. Habrá algo rico para compartir y un momento para desconectarnos del trabajo. ¡Tu presencia es el mejor regalo!"
              }
              className="auth-input mt-2 resize-none p-3 text-xs leading-5"
            />
          </label>

          <label className="form-label">
            URL de imagen para el anuncio (opcional)
            <input
              name="image_url"
              type="text"
              placeholder="/images/celebration.jpg"
              defaultValue={celebration?.image_url ?? ""}
              className="auth-input mt-2"
            />
            <span className="mt-1 block text-[10px] text-muted">
              Si lo dejas vacío, se usará la imagen festiva oficial de DIRCOM.
            </span>
          </label>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {celebration ? "Guardar cambios" : "Publicar celebración"}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function DeleteCelebrationModal({
  celebration,
  onClose,
}: {
  celebration: CelebrationWithEmployee;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(deleteCelebration, INITIAL_ACTION);

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => onClose(), 800);
      return () => clearTimeout(timer);
    }
  }, [state.status, onClose]);

  const empName = `${celebration.employee.first_name} ${celebration.employee.last_name}`;

  return (
    <Modal open onClose={onClose} title="Eliminar celebración">
      <form action={formAction} className="space-y-4 p-6">
        <Feedback state={state} />
        <input type="hidden" name="id" value={celebration.id} />

        <p className="text-sm leading-6 text-muted">
          ¿Seguro que deseas eliminar la celebración programada para{" "}
          <strong className="text-ink">{empName}</strong> ({celebration.title})? Esta acción no se puede deshacer.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {pending ? "Eliminando..." : "Eliminar celebración"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
