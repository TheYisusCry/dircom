"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/types/database";

export function FormFeedback({ state }: { state: ActionState }) {
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  if (!state.message) return null;

  return (
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
  );
}
