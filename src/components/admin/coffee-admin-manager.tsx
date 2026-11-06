"use client";

import { useActionState, useEffect, useState } from "react";
import { announceChange } from "@/components/live/live-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Avatar } from "@/components/ui/avatar";
import { Coffee, Plus, CheckCircle2, Clock3, Users, Sparkles, X } from "@/components/ui/icon";
import { avatarUrl } from "@/lib/auth/validation";
import { formatCalendarDate } from "@/lib/dates";
import {
  registerCoffeeDeliveryAction,
  deleteCoffeeDeliveryAction,
} from "@/app/actions/coffee";
import { INITIAL_ACTION, type ActionState } from "@/types/database";
import type {
  CoffeeDeliveryWithEmployee,
  CoffeeOfficeSummary,
  EmployeeCoffeeStatus,
} from "@/types/coffee";

export function CoffeeAdminManager({
  statuses,
  recentDeliveries,
  summary,
  todayIso,
}: {
  statuses: EmployeeCoffeeStatus[];
  recentDeliveries: CoffeeDeliveryWithEmployee[];
  summary: CoffeeOfficeSummary;
  todayIso: string;
}) {
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState(todayIso);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const [registerState, registerAction, registerPending] = useActionState(
    async (prev: ActionState, form: FormData) => {
      const res = await registerCoffeeDeliveryAction(prev, form);
      if (res.status === "success") {
        setRegisterModalOpen(false);
        setNote("");
        setQuantity(1);
        announceChange({ scope: "coffee" });
      }
      return res;
    },
    INITIAL_ACTION,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCoffeeDeliveryAction,
    INITIAL_ACTION,
  );

  useEffect(() => {
    if (deleteState.status === "success") {
      announceChange({ scope: "coffee" });
    }
  }, [deleteState.status]);

  const openRegisterModal = (empId?: string) => {
    setSelectedEmployeeId(empId ?? statuses[0]?.employeeId ?? "");
    setDeliveryDate(todayIso);
    setQuantity(1);
    setNote("");
    setRegisterModalOpen(true);
  };

  const selectedEmployee = statuses.find((s) => s.employeeId === selectedEmployeeId);

  return (
    <div className="space-y-8">
      {/* Feedback messages */}
      <FormFeedback state={registerState} />
      <FormFeedback state={deleteState} />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Users size={16} />
            <span>Total miembros</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {summary.totalEmployees}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest-ink">
            <CheckCircle2 size={16} />
            <span>Al día este mes</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-forest-ink">
            {summary.upToDateCount}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Clock3 size={16} />
            <span>Debe café</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
            {summary.pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest">
            <Coffee size={16} />
            <span>Cafés históricos</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {summary.officeTotalPackages}
          </p>
        </div>
      </div>

      {/* Main Employee Coffee Status Grid */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Estado mensual de empleados</h2>
            <p className="text-xs text-muted">
              Cuota de {summary.currentMonthLabel}. Registra las entregas para marcar el cumplimiento del mes y acumular adelantos.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => openRegisterModal()}
            className="self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Registrar entrega</span>
          </Button>
        </div>

        <div className="mt-6 divide-y divide-line">
          {statuses.map((emp) => {
            const isPending = emp.status === "pending";
            const isInAdvance = emp.status === "in_advance";

            return (
              <div
                key={emp.employeeId}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    employee={{
                      name: emp.employeeName,
                      photo: avatarUrl({ id: emp.employeeId, avatar_path: emp.avatarPath }),
                    }}
                    size={42}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">{emp.employeeName}</span>
                      {isInAdvance ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-forest/30 bg-mint px-2 py-0.5 text-[11px] font-semibold text-forest-ink">
                          <Sparkles size={12} />
                          Adelantado (+{emp.balance})
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          <Clock3 size={12} />
                          Debe café
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 size={12} />
                          Al día
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {emp.jobTitle ?? "Miembro de DIRCOM"} · {emp.totalDelivered} paquete(s) en total
                      {emp.lastDeliveryDate ? ` · Última: ${formatCalendarDate(emp.lastDeliveryDate)}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 px-3 text-xs w-full sm:w-auto"
                    onClick={() => openRegisterModal(emp.employeeId)}
                  >
                    <Coffee size={14} />
                    <span>+ Registrar café</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Deliveries & Undo History */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Historial de entregas recientes</h2>
            <p className="text-xs text-muted">
              Si registraste una entrega por error, puedes eliminarla aquí para revertir el balance.
            </p>
          </div>
        </div>

        {recentDeliveries.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line bg-mist/50 p-6 text-center text-xs text-muted">
            Aún no hay entregas de café registradas.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 pr-4 font-semibold whitespace-nowrap">Fecha</th>
                  <th className="pb-3 pr-4 font-semibold whitespace-nowrap">Empleado</th>
                  <th className="pb-3 pr-4 font-semibold whitespace-nowrap">Paquetes</th>
                  <th className="pb-3 pr-4 font-semibold whitespace-nowrap">Nota</th>
                  <th className="pb-3 text-right font-semibold whitespace-nowrap">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentDeliveries.map((del) => {
                  const empName = del.employee
                    ? `${del.employee.first_name} ${del.employee.last_name}`.trim()
                    : "Empleado";

                  return (
                    <tr key={del.id} className="hover:bg-mist/40 transition-colors">
                      <td className="py-3 pr-4 font-medium text-ink whitespace-nowrap">
                        {formatCalendarDate(del.delivery_date)}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-ink whitespace-nowrap">{empName}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-mint px-2 py-0.5 text-xs font-bold text-forest-ink">
                          <Coffee size={12} />
                          +{del.quantity}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted max-w-[200px] truncate">{del.note || "—"}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <form action={deleteAction} className="inline-block">
                          <input type="hidden" name="delivery_id" value={del.id} />
                          <button
                            type="submit"
                            disabled={deletePending}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Eliminar esta entrega y corregir el saldo"
                          >
                            <X size={13} />
                            <span>Deshacer</span>
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Registrar entrega */}
      {registerModalOpen && (
        <Modal
          open={registerModalOpen}
          title="Registrar entrega de café"
          onClose={() => setRegisterModalOpen(false)}
          maxWidth="max-w-xl"
        >
          <form action={registerAction} className="p-5 sm:p-7 space-y-4">
            <div>
              <label htmlFor="employee_id" className="block text-xs font-semibold text-ink mb-1">
                Empleado que entrega
              </label>
              <select
                id="employee_id"
                name="employee_id"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-forest"
              >
                {statuses.map((s) => (
                  <option key={s.employeeId} value={s.employeeId}>
                    {s.employeeName} ({s.status === "pending" ? "Debe café" : "Al día"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="delivery_date" className="block text-xs font-semibold text-ink mb-1">
                  Fecha de entrega
                </label>
                <input
                  type="date"
                  id="delivery_date"
                  name="delivery_date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-forest"
                />
              </div>

              <div>
                <label htmlFor="quantity" className="block text-xs font-semibold text-ink mb-1">
                  Cantidad de paquetes
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-forest"
                />
              </div>
            </div>

            <div>
              <label htmlFor="note" className="block text-xs font-semibold text-ink mb-1">
                Nota u observación (opcional)
              </label>
              <input
                type="text"
                id="note"
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. Café Juan Valdez 500g, grano entero"
                maxLength={120}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-forest"
              />
            </div>

            {selectedEmployee && selectedEmployee.status !== "pending" && (
              <p className="rounded-xl border border-forest/30 bg-mint p-3 text-xs leading-5 text-forest-ink">
                <strong>Nota:</strong> {selectedEmployee.employeeName} ya está al día este mes. Este paquete se computará automáticamente como <strong>adelanto para el próximo mes</strong>.
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRegisterModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={registerPending}>
                {registerPending ? "Guardando..." : "Guardar entrega"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
