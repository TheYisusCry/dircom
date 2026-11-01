"use client";
import { useActionState, useEffect, useState } from "react";
import {
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  changeEmployeeStatus,
} from "@/app/admin/empleados/actions";
import {
  INITIAL_ACTION,
  type Profile,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { MONTH_NAMES } from "@/lib/dates";
import { Eye, EyeOff } from "@/components/ui/icon";

export function EmployeeForm({
  employee,
  onCancel,
}: {
  employee?: Profile;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState({
    first_name: employee?.first_name ?? "",
    last_name: employee?.last_name ?? "",
    username: employee?.username ?? "",
    password: "",
    job_title: employee?.job_title ?? "",
    birthday_day: employee?.birthday_day ? String(employee.birthday_day) : "",
    birthday_month: employee?.birthday_month ? String(employee.birthday_month) : "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(
    employee ? updateEmployee : createEmployee,
    INITIAL_ACTION,
  );
  return (
    <form action={action} autoComplete="off" className="space-y-4 p-4 sm:space-y-5 sm:p-6">
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
              autoComplete="off"
              spellCheck={false}
              data-lpignore="true"
              value={formData.first_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, first_name: e.target.value }))
              }
              className="auth-input mt-2"
            />
          </label>
          <label className="form-label">
            Apellido
            <input
              name="last_name"
              required
              maxLength={60}
              autoComplete="off"
              spellCheck={false}
              data-lpignore="true"
              value={formData.last_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, last_name: e.target.value }))
              }
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
                spellCheck={false}
                data-lpignore="true"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                className="auth-input mt-2"
              />
              <span className="mt-1 block text-[11px] font-normal text-muted">
                De 3 a 32 caracteres.
              </span>
            </label>
            <label className="form-label">
              Contraseña inicial
              <div className="relative mt-2">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  maxLength={64}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="auth-input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-ink focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordHint />
            </label>
          </>
        )}
        <label className="form-label">
          Cargo
          <input
            name="job_title"
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            value={formData.job_title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, job_title: e.target.value }))
            }
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
              value={formData.birthday_day}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, birthday_day: e.target.value }))
              }
              className="auth-input mt-2"
            />
          </label>
          <label className="form-label">
            Mes
            <select
              name="birthday_month"
              value={formData.birthday_month}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  birthday_month: e.target.value,
                }))
              }
              className="auth-input mt-2"
            >
              <option value="">Sin cumpleaños</option>
              {MONTH_NAMES.map((month, index) => (
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
      <FormFeedback state={state} />
      <div className="flex items-center gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={pending}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          className={onCancel ? "flex-1" : "w-full"}
        >
          {pending
            ? "Guardando…"
            : employee
              ? "Guardar cambios"
              : "Crear empleado"}
        </Button>
      </div>
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
export function PasswordResetForm({
  employee,
  onCancel,
}: {
  employee: Profile;
  onCancel?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(
    resetEmployeePassword,
    INITIAL_ACTION,
  );
  return (
    <form action={action} autoComplete="off" className="space-y-4 p-4 sm:space-y-5 sm:p-6">
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
        <div className="relative mt-2">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            maxLength={64}
            autoComplete="new-password"
            disabled={pending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={pending}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-ink focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <PasswordHint />
      </label>
      <FormFeedback state={state} />
      <div className="flex items-center gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={pending}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          className={onCancel ? "flex-1" : "w-full"}
        >
          {pending ? "Restableciendo…" : "Restablecer contraseña"}
        </Button>
      </div>
    </form>
  );
}
export function StatusForm({
  employee,
  blockAgain = false,
  onCancel,
}: {
  employee: Profile;
  blockAgain?: boolean;
  onCancel?: () => void;
}) {
  const activate = !employee.is_active && !blockAgain;
  const [state, action, pending] = useActionState(
    changeEmployeeStatus,
    INITIAL_ACTION,
  );
  return (
    <form action={action} autoComplete="off" className="space-y-4 p-4 sm:space-y-5 sm:p-6">
      <input type="hidden" name="id" value={employee.id} />
      <input
        type="hidden"
        name="is_active"
        value={activate ? "true" : "false"}
      />
      {activate ? (
        <>
          <p className="text-sm leading-6 text-muted">
            Estás por contratar nuevamente a{" "}
            <strong className="text-ink">
              {employee.first_name} {employee.last_name}
            </strong>
            . El empleado recuperará el acceso a DIRCOM con sus credenciales.
          </p>
          <label className="form-label">
            Cargo / Puesto
            <input
              name="job_title"
              defaultValue={employee.job_title ?? ""}
              maxLength={100}
              autoComplete="off"
              disabled={pending}
              placeholder="Ej. Especialista Web, Diseñador..."
              className="auth-input mt-2"
            />
            <span className="mt-1 block text-[11px] font-normal text-muted">
              Puedes confirmar el cargo actual o modificarlo antes de contratar.
            </span>
          </label>
        </>
      ) : (
        <p className="text-sm leading-6 text-muted">
          ¿Estás seguro de que deseas despedir a{" "}
          <strong className="text-ink">
            {employee.first_name} {employee.last_name}
          </strong>
          ? El empleado perderá acceso a la aplicación y dejará de aparecer en
          el directorio interno activo. Se conservará su historial y registros previos.
        </p>
      )}
      <FormFeedback state={state} />
      <div className="flex items-center gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={pending}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          className={onCancel ? "flex-1" : "w-full"}
        >
          {pending
            ? activate
              ? "Contratando…"
              : "Despidiendo…"
            : activate
              ? "Contratar empleado"
              : "Despedir empleado"}
        </Button>
      </div>
    </form>
  );
}
