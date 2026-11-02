"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onLiveChange, useLive } from "./live-provider";

/** Only mounted in the voting admin page, whose participation count is private. */
export function AdminLiveRefresh() {
  const router = useRouter();
  const { connection } = useLive();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let lastRead = 0;
    function refresh() {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      timer = setTimeout(() => { lastRead = Date.now(); router.refresh(); }, 200);
    }
    const unsubscribe = onLiveChange(({ scope }) => { if (scope === "voting") refresh(); });
    const interval = setInterval(() => { if (Date.now() - lastRead >= 15_000) refresh(); }, 1000);
    const resume = () => { if (Date.now() - lastRead > 1000) refresh(); };
    if (connection === "connected") refresh();
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      unsubscribe(); clearTimeout(timer); clearInterval(interval);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [connection, router]);
  return null;
}
