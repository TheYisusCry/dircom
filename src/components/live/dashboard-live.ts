"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DashboardData, DashboardScope } from "@/lib/dashboard";
import type { VotingRoundRow } from "@/types/database";
import { getOfficeCurrentDate } from "@/lib/dates";
import { revelationRemaining } from "@/lib/live";
import { onLiveChange, useLive } from "./live-provider";

export function useDashboard(initialData: DashboardData) {
  const router = useRouter();
  const { connection } = useLive();
  const [failed, setFailed] = useState<DashboardScope[]>([]);
  const [snapshot, setSnapshot] = useState({ source: initialData, data: initialData });
  if (snapshot.source !== initialData) setSnapshot({ source: initialData, data: initialData });

  useEffect(() => {
    let disposed = false;
    const pending = new Set<DashboardScope>();
    const dirty = new Set<DashboardScope>();
    const timers = new Map<DashboardScope, ReturnType<typeof setTimeout>>();
    const controller = new AbortController();
    const lastRead = new Map<DashboardScope, number>();
    const retryAt = new Map<DashboardScope, number>();
    const failures = new Map<DashboardScope, number>();
    let day = getOfficeCurrentDate().todayIso;

    async function update(scope: DashboardScope) {
      if (disposed || document.visibilityState !== "visible") return;
      if (Date.now() < (retryAt.get(scope) ?? 0)) return;
      if (pending.has(scope)) { dirty.add(scope); return; }
      pending.add(scope);
      lastRead.set(scope, Date.now());
      try {
        const response = await fetch(`/api/dashboard/${scope}`, { cache: "no-store", signal: controller.signal });
        if (response.status === 401) { router.replace("/login"); return; }
        if (!response.ok) throw new Error("Actualización pendiente");
        const section = await response.json();
        if (!disposed) {
          setSnapshot((current) => ({ ...current, data: { ...current.data, [scope]: section } }));
          lastRead.set(scope, Date.now());
          retryAt.delete(scope); failures.delete(scope);
          setFailed((current) => current.filter((section) => section !== scope));
        }
      } catch {
        if (!disposed) {
          const attempts = (failures.get(scope) ?? 0) + 1;
          failures.set(scope, attempts);
          retryAt.set(scope, Date.now() + Math.min(120_000, 15_000 * 2 ** (attempts - 1)));
          setFailed((current) => current.includes(scope) ? current : [...current, scope]);
        }
      }
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
    schedule("activities"); schedule("voting");
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
  }, [connection, router, initialData]);
  return { data: snapshot.data, connection, stale: failed.length > 0 };
}

export function useRevelation(round: VotingRoundRow | null, snapshotTime: number) {
  const { serverNow, synchronized } = useLive();
  const id = round?.id;
  const revealAt = round?.reveal_at;
  const [state, setState] = useState({ id, now: snapshotTime, celebrationKey: "" });
  const waiting = useRef<string | null>(null);
  const observed = useRef<string | null>(null);
  useEffect(() => {
    if (!round?.reveal_at || revelationRemaining(round.reveal_at, snapshotTime) === 0) return;
    for (const place of round.podium ?? []) {
      if (place.employee_photo) { const image = new Image(); image.src = place.employee_photo; }
    }
  }, [round, snapshotTime]);
  useEffect(() => {
    const started = performance.now();
    let timer: ReturnType<typeof setInterval> | undefined;
    function tick() {
      // Until the credential request calibrates the clock, advance the SSR
      // timestamp monotonically instead of trusting the computer's wall clock.
      const now = synchronized ? serverNow() : snapshotTime + performance.now() - started;
      const remaining = revelationRemaining(revealAt, now);
      if (remaining > 0 && id) waiting.current = id;
      let celebrate = false;
      if (id && waiting.current === id && remaining === 0 && observed.current !== id) {
        observed.current = id;
        const storageKey = `dircom:revealed:${id}`;
        let seen = false;
        try { seen = sessionStorage.getItem(storageKey) === "1"; sessionStorage.setItem(storageKey, "1"); } catch { /* storage may be disabled */ }
        celebrate = !seen && document.visibilityState === "visible" && Boolean(revealAt) && now - Date.parse(revealAt!) < 4000;
      }
      setState((current) => current.id === id && !celebrate && Math.ceil(revelationRemaining(revealAt, current.now) / 1000) === Math.ceil(remaining / 1000)
        ? current : { id, now, celebrationKey: celebrate ? id! : current.celebrationKey });
      if (remaining === 0) clearInterval(timer);
    }
    if (revealAt && revelationRemaining(revealAt, snapshotTime) > 0) timer = setInterval(tick, 50);
    const immediate = setTimeout(tick, 0);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); clearTimeout(immediate); document.removeEventListener("visibilitychange", tick); };
  }, [id, revealAt, serverNow, synchronized, snapshotTime]);
  return {
    remaining: revelationRemaining(revealAt, state.id === id ? state.now : snapshotTime),
    celebrationKey: state.celebrationKey,
  };
}
