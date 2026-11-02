"use client";

import { useState } from "react";
import { LockKeyhole } from "@/components/ui/icon";
import { ConsentDocumentModal } from "./consent-document-modal";

export function ConsentViewerButton({
  employeeName,
  variant = "link",
  className = "",
}: {
  employeeName: string;
  variant?: "link" | "button";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:bg-mist transition ${className}`}
        >
          <LockKeyhole size={15} className="text-forest" />
          <span>Información sobre consentimiento</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 text-xs text-muted hover:text-forest transition underline ${className}`}
        >
          <LockKeyhole size={13} className="text-forest" />
          <span>Información sobre consentimiento</span>
        </button>
      )}

      <ConsentDocumentModal
        open={open}
        onClose={() => setOpen(false)}
        employeeName={employeeName}
      />
    </>
  );
}
