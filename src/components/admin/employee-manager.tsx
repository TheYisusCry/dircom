"use client";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Plus, LockKeyhole, Users } from "@/components/ui/icon";
import { avatarUrl } from "@/lib/auth/validation";
import type { Profile } from "@/types/database";
import { EmployeeForm, PasswordResetForm, StatusForm } from "./employee-forms";

type Selection =
  | { mode: "edit" | "password" | "status" | "block"; employee: Profile }
  | { mode: "create" }
  | null;
export function EmployeeManager({
  employees,
  activeCount,
}: {
  employees: Profile[];
  activeCount?: number;
}) {
  const [selection, setSelection] = useState<Selection>(null);
  const close = () => setSelection(null);

  const computedActiveCount =
    activeCount ??
    employees.filter((e) => e.role === "employee" && e.is_active).length;

  const sortedEmployees = employees
    .filter((e) => e.role === "employee")
    .sort((a, b) => {
      // 1. Activos primero, Despedidos (desactivados) abajo del todo
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      // 2. Organizados alfabéticamente por el campo apellido
      const cmpLast = (a.last_name || "").localeCompare(b.last_name || "", "es", {
        sensitivity: "base",
      });
      if (cmpLast !== 0) return cmpLast;
      // 3. Si coinciden en apellido, desempatar alfabéticamente por nombre
      return (a.first_name || "").localeCompare(b.first_name || "", "es", {
        sensitivity: "base",
      });
    });
  const actions = (employee: Profile) => (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => setSelection({ mode: "edit", employee })}
        className="admin-link"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={() => setSelection({ mode: "password", employee })}
        className="admin-link"
      >
        Contraseña
      </button>
      <button
        type="button"
        onClick={() => setSelection({ mode: "status", employee })}
        className="admin-link"
      >
        {employee.is_active ? "Despedir" : "Contratar"}
      </button>
      {!employee.is_active && (
        <button
          type="button"
          onClick={() => setSelection({ mode: "block", employee })}
          className="admin-link"
        >
          Reintentar bloqueo
        </button>
      )}
    </div>
  );
  const person = (employee: Profile) => (
    <div className="flex items-center gap-3">
      <Avatar
        employee={{
          name: `${employee.first_name} ${employee.last_name}`,
          photo: avatarUrl(employee),
        }}
        size={40}
      />
      <div>
        <p className="text-sm font-bold">
          {employee.first_name} {employee.last_name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {employee.job_title || "Sin cargo"}
        </p>
      </div>
    </div>
  );
  const birthday = (employee: Profile) =>
    employee.birthday_day && employee.birthday_month
      ? `${String(employee.birthday_day).padStart(2, "0")}/${String(employee.birthday_month).padStart(2, "0")}`
      : "Sin configurar";
  const status = (employee: Profile) => (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${employee.is_active ? "bg-mint text-forest-ink" : "bg-mist text-muted"}`}
    >
      {employee.is_active ? "Activo" : "Despedido"}
    </span>
  );
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Users size={18} />
            Cuentas privadas administradas por DIRCOM
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest-ink">
            <span className="size-2 rounded-full bg-forest" />
            {computedActiveCount} {computedActiveCount === 1 ? "empleado activo" : "empleados activos"}
          </span>
        </div>
        <Button onClick={() => setSelection({ mode: "create" })}>
          <Plus size={18} />
          Crear empleado
        </Button>
      </div>
      <div className="panel hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <caption className="sr-only">
            Cuentas de empleados
          </caption>
          <thead className="border-b border-line bg-mist text-xs text-muted">
            <tr>
              {["Empleado", "Usuario", "Cumpleaños", "Estado", "Acciones"].map(
                (label) => (
                  <th
                    scope="col"
                    key={label}
                    className="px-5 py-4 font-semibold"
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((employee) => (
              <tr
                key={employee.id}
                className="border-b border-line last:border-0"
              >
                <td className="px-5 py-5">{person(employee)}</td>
                <td className="px-5 py-5 text-xs font-medium">
                  {employee.username}
                </td>
                <td className="px-5 py-5 text-xs text-muted">
                  {birthday(employee)}
                </td>
                <td className="px-5 py-5">{status(employee)}</td>
                <td className="px-5 py-5">{actions(employee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-4 md:hidden">
        {sortedEmployees.map((employee) => (
          <article key={employee.id} className="panel space-y-4 p-5">
            {person(employee)}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span>{employee.username}</span>
              {status(employee)}
              <span className="text-muted">
                Cumpleaños: {birthday(employee)}
              </span>
            </div>
            {actions(employee)}
          </article>
        ))}
      </div>
      {!sortedEmployees.length && (
        <div className="panel p-8 text-center text-sm text-muted">
          Todavía no hay empleados en esta página.
        </div>
      )}
      <Modal
        open={selection !== null}
        onClose={close}
        closeOnClickOutside={false}
        title={
          selection?.mode === "create"
            ? "Crear empleado"
            : selection?.mode === "edit"
              ? "Editar empleado"
              : selection?.mode === "password"
                ? "Restablecer contraseña"
                : selection?.employee.is_active
                  ? "Despedir empleado"
                  : "Contratar empleado"
        }
      >
        {selection?.mode === "create" ? (
          <EmployeeForm onCancel={close} />
        ) : selection?.mode === "edit" ? (
          <EmployeeForm employee={selection.employee} onCancel={close} />
        ) : selection?.mode === "password" ? (
          <PasswordResetForm employee={selection.employee} onCancel={close} />
        ) : selection ? (
          <StatusForm
            employee={selection.employee}
            blockAgain={selection.mode === "block"}
            onCancel={close}
          />
        ) : null}
      </Modal>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <LockKeyhole size={14} />
        Las contraseñas nunca se muestran en este listado.
      </p>
    </>
  );
}
