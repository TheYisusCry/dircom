"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "@/components/ui/icon";

function hasFormWithData(container: HTMLElement): boolean {
  const form = container.querySelector("form");
  if (!form) return false;

  const elements = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), textarea, select"
  );

  for (const el of elements) {
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        if (el.checked !== el.defaultChecked) return true;
      } else {
        const val = el.value.trim();
        if (val.length > 0 && (el.defaultValue === "" || val !== el.defaultValue.trim())) {
          return true;
        }
      }
    } else if (el instanceof HTMLTextAreaElement) {
      const val = el.value.trim();
      if (val.length > 0 && (el.defaultValue === "" || val !== el.defaultValue.trim())) {
        return true;
      }
    } else if (el instanceof HTMLSelectElement) {
      const defaultOption = Array.from(el.options).find((opt) => opt.defaultSelected);
      if (defaultOption) {
        if (el.value !== defaultOption.value) return true;
      } else if (el.selectedIndex > 0) {
        return true;
      }
    }
  }
  return false;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  closeOnClickOutside = true,
  maxWidth = "max-w-xl",
  showCloseButton = true,
  isDirty,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeOnClickOutside?: boolean;
  maxWidth?: string;
  showCloseButton?: boolean;
  isDirty?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  const handleBlockedClose = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const isFormDirty = (): boolean => {
    if (isDirty !== undefined) return isDirty;
    return ref.current ? hasFormWithData(ref.current) : false;
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (showCloseButton && closeOnClickOutside) {
          if (isFormDirty()) {
            handleBlockedClose();
            return;
          }
          onClose();
        }
      }}
      onClick={(event) => {
        if (!closeOnClickOutside) return;
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          if (isFormDirty()) {
            handleBlockedClose();
            return;
          }
          onClose();
        }
      }}
      className={`m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] ${maxWidth} overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-ink/55 sm:w-[calc(100%-2rem)]`}
    >
      {open && (
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
          animate={
            shake && !reducedMotion
              ? { x: [-5, 5, -4, 4, -2, 2, 0], y: 0, opacity: 1 }
              : { opacity: 1, y: 0, x: 0 }
          }
          transition={{ duration: shake ? 0.3 : (reducedMotion ? 0 : 0.2) }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ventana"
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-mist"
              >
                <X size={20} aria-hidden="true" />
              </button>
            )}
          </div>
          {children}
        </motion.div>
      )}
    </dialog>
  );
}
