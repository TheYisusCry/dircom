"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  changeEmployeeStatus,
} from "@/app/admin/empleados/actions";
import {
  INITIAL_ACTION,
  type Profile,
  type ActionState,
} from "@/types/database";
import { Button } from "@/components/ui/button";

function Feedback({ state }: { state: ActionState }) {
  const router = useRouter();
  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);
  return state.message ? (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={`rounded-xl border p-4 text-sm leading-6 ${state.status === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-forest/20 bg-mint text-forest-ink"}`}
    >
      {state.message}
    </p>
  ) : null;
}
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function EmployeeForm({ employee }: { employee?: Profile }) {
  const [state, action, pending] = useActionState(
    employee ? updateEmployee : createEmployee,
    INITIAL_ACTION,
  );
  return (
    <form action={action} className="space-y-5 p-6">
      {employee && (
        <>
          <input type="hidden" name="id" value={employee.id} />
          <p className="rounded-xl bg-mist p-3 text-xs text-muted">
            Usuario: <strong className="text-ink">{employee.username}</strong> ·
            El identificador y el usuario se conservan.
          </p>
        </>
      )}
      <fieldset disabled={pending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-label">
            Nombre
            <input
              name="first_name"
              required
              maxLength={60}
              defaultValue={employee?.first_name}
              className="auth-input mt-2"
            />
          </label>
          <label className="form-label">
            Apellido
            <input
              name="last_name"
              required
              maxLength={60}
              defaultValue={employee?.last_name}
              className="auth-input mt-2"
            />
          </label>
        </div>
        {!employee && (
          <>
            <label className="form-label">
              Usuario
              <input
                name="username"
                required
                minLength={3}
                maxLength={32}
                autoComplete="off"
                autoCapitalize="none"
                className="auth-input mt-2"
              />
              <span className="mt-1 block text-[11px] font-normal text-muted">
                3–32 caracteres. Empieza con una letra; usa letras, números,
                punto o guion.
              </span>
            </label>
            <label className="form-label">
              Contraseña inicial
              <input
                name="password"
                type="password"
                required
                minLength={6}
                maxLength={64}
                autoComplete="new-password"
                className="auth-input mt-2"
              />
              <PasswordHint />
            </label>
          </>
        )}
        <label className="form-label">
          Cargo
          <input
            name="job_title"
            maxLength={100}
            defaultValue={employee?.job_title ?? ""}
            className="auth-input mt-2"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="form-label">
            Día de cumpleaños
            <input
              name="birthday_day"
              type="number"
              min={1}
              max={31}
              defaultValue={employee?.birthday_day ?? ""}
              className="auth-input mt-2"
            />
          </label>
          <label className="form-label">
            Mes
            <select
              name="birthday_month"
              defaultValue={employee?.birthday_month ?? ""}
              className="auth-input mt-2"
            >
              <option value="">Sin cumpleaños</option>
              {months.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-muted">
          Opcional. Completa ambos campos o déjalos vacíos. No se guarda el año
          de nacimiento.
        </p>
        <label className="form-label">
          Fotografía {employee ? "nueva" : "(opcional)"}
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="auth-input mt-2 py-3 text-xs"
          />
          <span className="mt-1 block text-[11px] font-normal text-muted">
            JPEG, PNG o WebP, hasta 3 MB. Una fotografía nueva sustituye la
            actual.
          </span>
        </label>
      </fieldset>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Guardando…"
          : employee
            ? "Guardar cambios"
            : "Crear empleado"}
      </Button>
    </form>
  );
}
function PasswordHint() {
  return (
    <span className="mt-1 block text-[11px] font-normal leading-5 text-muted">
      Mínimo 6 caracteres. No necesitas combinar mayúsculas, números ni
      símbolos.
    </span>
  );
}
export function PasswordResetForm({ employee }: { employee: Profile }) {
  const [state, action, pending] = useActionState(
    resetEmployeePassword,
    INITIAL_ACTION,
  );
  return (
    <form action={action} className="space-y-5 p-6">
      <input type="hidden" name="id" value={employee.id} />
      <p className="text-sm leading-6 text-muted">
        Establece una contraseña nueva para{" "}
        <strong className="text-ink">
          {employee.first_name} {employee.last_name}
        </strong>
        . Sus sesiones anteriores perderán acceso.
      </p>
      <label className="form-label">
        Nueva contraseña
        <input
          name="password"
          type="password"
          required
          minLength={6}
          maxLength={64}
          autoComplete="new-password"
          disabled={pending}
          className="auth-input mt-2"
        />
        <PasswordHint />
      </label>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Restableciendo…" : "Restablecer contraseña"}
      </Button>
    </form>
  );
}
export function StatusForm({
  employee,
  blockAgain = false,
}: {
  employee: Profile;
  blockAgain?: boolean;
}) {
  const activate = !employee.is_active && !blockAgain;
  const [state, action, pending] = useActionState(
    changeEmployeeStatus,
    INITIAL_ACTION,
  );
  return (
    <form action={action} className="space-y-5 p-6">
      <input type="hidden" name="id" value={employee.id} />
      <input
        type="hidden"
        name="is_active"
        value={activate ? "true" : "false"}
      />
      <p className="text-sm leading-7 text-muted">
        {activate
          ? "El empleado podrá volver a iniciar sesión con sus credenciales. Las sesiones antiguas seguirán bloqueadas."
          : "El empleado perderá acceso a la aplicación y dejará de aparecer en el directorio interno activo. Se conservará su historial."}
      </p>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Actualizando…"
          : activate
            ? "Reactivar empleado"
            : "Desactivar empleado"}
      </Button>
    </form>
  );
}
