"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "@/components/ui/icon";

export function Modal({
  open,
  onClose,
  title,
  children,
  closeOnClickOutside = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeOnClickOutside?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();
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

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
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
        )
          onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-ink/55 sm:w-[calc(100%-2rem)]"
    >
      {open && (
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-mist"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {children}
        </motion.div>
      )}
    </dialog>
  );
}
