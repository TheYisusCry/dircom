import { Avatar } from "@/components/ui/avatar";
import { CheckCircle2, Clock3, Sparkles } from "@/components/ui/icon";
import { avatarUrl } from "@/lib/auth/validation";
import type { EmployeeCoffeeStatus, CoffeeOfficeSummary } from "@/types/coffee";

export function CoffeeStatusGrid({
  statuses,
  summary,
}: {
  statuses: EmployeeCoffeeStatus[];
  summary: CoffeeOfficeSummary;
}) {
  const upToDate = statuses.filter((s) => s.status !== "pending");
  const pending = statuses.filter((s) => s.status === "pending");

  return (
    <div className="panel flex flex-col justify-between p-5 sm:p-6">
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-ink">
              Cuota de {summary.currentMonthLabel}
            </h3>
            <p className="text-xs text-muted">
              {summary.upToDateCount} de {summary.totalEmployees} empleados al día con su café
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-mint px-3 py-1 text-xs font-bold text-forest-ink">
            {summary.progressPercentage}% completado
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-forest transition-all duration-500 ease-out"
            style={{ width: `${summary.progressPercentage}%` }}
          />
        </div>

        {/* Status columns */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Col 1: Al día / Adelantados */}
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-forest-ink">
              <CheckCircle2 size={16} />
              <span>Al día / Con saldo a favor ({upToDate.length})</span>
            </div>

            {upToDate.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted">
                Nadie ha traído café este mes todavía.
              </p>
            ) : (
              <ul className="space-y-2">
                {upToDate.map((emp) => {
                  const photo = avatarUrl({ id: emp.employeeId, avatar_path: emp.avatarPath });
                  const isAdvance = emp.status === "in_advance";

                  return (
                    <li
                      key={emp.employeeId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-forest/15 bg-mint/40 p-2.5 transition-colors hover:bg-mint/70"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar employee={{ name: emp.employeeName, photo }} size={32} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-ink">
                            {emp.employeeName}
                          </p>
                          <p className="truncate text-[10px] text-muted">
                            {emp.totalDelivered} {emp.totalDelivered === 1 ? "paquete traído" : "paquetes traídos"}
                          </p>
                        </div>
                      </div>

                      {isAdvance ? (
                        <span className="shrink-0 ml-1.5 inline-flex items-center gap-1 rounded-full border border-forest/30 bg-mint px-2 py-0.5 text-[10px] font-bold text-forest-ink">
                          <Sparkles size={11} />
                          +{emp.balance} adelanto
                        </span>
                      ) : (
                        <span className="shrink-0 ml-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 size={11} />
                          Al día
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Col 2: Pendientes */}
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Clock3 size={16} />
              <span>Pendientes ({pending.length})</span>
            </div>

            {pending.length === 0 ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center text-xs font-semibold text-emerald-800">
                🎉 ¡Todo el equipo está al día con el café!
              </p>
            ) : (
              <ul className="space-y-2">
                {pending.map((emp) => {
                  const photo = avatarUrl({ id: emp.employeeId, avatar_path: emp.avatarPath });

                  return (
                    <li
                      key={emp.employeeId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-amber-200/60 bg-amber-50/30 p-2.5 transition-colors hover:bg-amber-50/70"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar employee={{ name: emp.employeeName, photo }} size={32} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-ink">
                            {emp.employeeName}
                          </p>
                          <p className="truncate text-[10px] text-muted">
                            {emp.jobTitle ?? "Miembro del equipo"}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 ml-1.5 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Clock3 size={11} />
                        Debe café
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
