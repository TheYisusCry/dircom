"use client";
import { useState } from "react";
import Link from "next/link";
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
export function EmployeeManager({ employees }: { employees: Profile[] }) {
  const [selection, setSelection] = useState<Selection>(null);
  const close = () => setSelection(null);
  const actions = (employee: Profile) =>
    employee.role === "admin" ? (
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/cuenta" className="admin-link">
          Cambiar contraseña
        </Link>
        <span className="rounded-lg bg-mist px-3 py-2 text-[11px] text-muted">
          Cuenta protegida
        </span>
      </div>
    ) : (
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
          {employee.is_active ? "Desactivar" : "Reactivar"}
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
          {employee.job_title ||
            (employee.role === "admin" ? "Administrador" : "Sin cargo")}
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
      {employee.is_active ? "Activo" : "Desactivado"}
    </span>
  );
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Users size={18} />
          Cuentas privadas administradas por DIRCOM
        </p>
        <Button onClick={() => setSelection({ mode: "create" })}>
          <Plus size={18} />
          Crear empleado
        </Button>
      </div>
      <div className="panel hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <caption className="sr-only">
            Cuentas de empleados y administrador
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
            {employees.map((employee) => (
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
        {employees.map((employee) => (
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
      {!employees.length && (
        <div className="panel p-8 text-center text-sm text-muted">
          Todavía no hay empleados en esta página.
        </div>
      )}
      <Modal
        open={selection !== null}
        onClose={close}
        title={
          selection?.mode === "create"
            ? "Crear empleado"
            : selection?.mode === "edit"
              ? "Editar empleado"
              : selection?.mode === "password"
                ? "Restablecer contraseña"
                : "Cambiar estado"
        }
      >
        {selection?.mode === "create" ? (
          <EmployeeForm />
        ) : selection?.mode === "edit" ? (
          <EmployeeForm employee={selection.employee} />
        ) : selection?.mode === "password" ? (
          <PasswordResetForm employee={selection.employee} />
        ) : selection ? (
          <StatusForm
            employee={selection.employee}
            blockAgain={selection.mode === "block"}
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
