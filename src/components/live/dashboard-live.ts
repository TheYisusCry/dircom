"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardData, DashboardScope } from "@/lib/dashboard";
import type { VotingRoundRow } from "@/types/database";
import { getOfficeCurrentDate } from "@/lib/dates";
import { revelationRemaining } from "@/lib/live";
import { onLiveChange, useLive } from "./live-provider";

export function useDashboard(initialData: DashboardData) {
  const { connection } = useLive();
  const [snapshot, setSnapshot] = useState({ source: initialData, data: initialData });
  if (snapshot.source !== initialData) setSnapshot({ source: initialData, data: initialData });

  useEffect(() => {
    let disposed = false;
    const pending = new Set<DashboardScope>();
    const dirty = new Set<DashboardScope>();
    const timers = new Map<DashboardScope, ReturnType<typeof setTimeout>>();
    const controller = new AbortController();
    const lastRead = new Map<DashboardScope, number>();
    let day = getOfficeCurrentDate().todayIso;

    async function update(scope: DashboardScope) {
      if (disposed || document.visibilityState !== "visible") return;
      if (pending.has(scope)) { dirty.add(scope); return; }
      pending.add(scope);
      try {
        const response = await fetch(`/api/dashboard/${scope}`, { cache: "no-store", signal: controller.signal });
        if (response.status === 401) { window.location.assign("/login"); return; }
        if (!response.ok) throw new Error("Actualización pendiente");
        const section = await response.json();
        if (!disposed) {
          setSnapshot((current) => ({ ...current, data: { ...current.data, [scope]: section } }));
          lastRead.set(scope, Date.now());
        }
      } catch { /* Keep the last successful snapshot; retry on the next tick. */ }
      finally {
        pending.delete(scope);
        if (!disposed && dirty.delete(scope)) schedule(scope);
      }
    }
    function schedule(scope: DashboardScope) {
      clearTimeout(timers.get(scope));
      timers.set(scope, setTimeout(() => void update(scope), scope === "voting" ? 0 : 150));
    }
    const unsubscribe = onLiveChange(({ scope }) => schedule(scope));
    function resume() {
      if (document.visibilityState !== "visible") return;
      for (const scope of ["birthdays", "coffee", "activities", "voting"] as const) {
        if (Date.now() - (lastRead.get(scope) ?? 0) > 1000) schedule(scope);
      }
    }
    // Low-frequency health check also recovers missed publication/configuration
    // events. Fast polling is used only when the realtime connection is down.
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      const today = getOfficeCurrentDate().todayIso;
      if (today !== day) { day = today; schedule("birthdays"); schedule("coffee"); }
      const intervals = { birthdays: 300_000, coffee: 60_000, activities: connection === "connected" ? 300_000 : 15_000, voting: connection === "connected" ? 300_000 : 15_000 };
      for (const scope of Object.keys(intervals) as DashboardScope[]) {
        if (now - (lastRead.get(scope) ?? now) >= intervals[scope]) schedule(scope);
      }
    }, 1000);
    for (const scope of ["birthdays", "coffee", "activities", "voting"] as const) lastRead.set(scope, Date.now());
    // Connect first, then read: don't lose changes between SSR and subscription.
    resume();
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      controller.abort();
      unsubscribe();
      clearInterval(timer);
      timers.forEach(clearTimeout);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [connection]);
  return { data: snapshot.data, connection };
}

export function useRevelation(round: VotingRoundRow | null, snapshotTime: number) {
  const { serverNow } = useLive();
  const [state, setState] = useState({ remaining: revelationRemaining(round?.reveal_at, snapshotTime), celebrationKey: "" });
  const waiting = useRef<string | null>(null);
  const observed = useRef<string | null>(null);
  const revealAt = round?.reveal_at;
  const id = round?.id;
  useEffect(() => {
    function tick() {
      const now = serverNow();
      const remaining = revelationRemaining(revealAt, now);
      if (remaining > 0 && id) waiting.current = id;
      setState((current) => {
        let celebrationKey = current.celebrationKey;
        if (id && waiting.current === id && remaining === 0 && observed.current !== id) {
          observed.current = id;
          const storageKey = `dircom:revealed:${id}`;
          let seen = false;
          try { seen = sessionStorage.getItem(storageKey) === "1"; sessionStorage.setItem(storageKey, "1"); } catch { /* storage may be disabled */ }
          if (!seen && document.visibilityState === "visible" && revealAt && now - Date.parse(revealAt) < 4000) celebrationKey = id;
        }
        return current.remaining === remaining && current.celebrationKey === celebrationKey ? current : { remaining, celebrationKey };
      });
    }
    const timer = setInterval(tick, 50);
    const immediate = setTimeout(tick, 0);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); clearTimeout(immediate); document.removeEventListener("visibilitychange", tick); };
  }, [id, revealAt, serverNow]);
  // Hide a newly received podium immediately, before the timer's next tick.
  return { remaining: revealAt && state.remaining === 0 && Date.parse(revealAt) > snapshotTime ? revelationRemaining(revealAt, serverNow()) : state.remaining, celebrationKey: state.celebrationKey };
}
