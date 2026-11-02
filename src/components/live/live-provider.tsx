"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { serverClockOffset } from "@/lib/live";

export type LiveScope = "activities" | "voting" | "birthdays" | "coffee";
export type LiveChange = { scope: LiveScope; activityId?: string };
const CHANGE_EVENT = "dircom:change";
export function announceChange(change: LiveChange) {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: change }));
}
export function onLiveChange(listener: (change: LiveChange) => void) {
  const receive = (event: Event) => listener((event as CustomEvent<LiveChange>).detail);
  window.addEventListener(CHANGE_EVENT, receive);
  return () => window.removeEventListener(CHANGE_EVENT, receive);
}

type Connection = "connecting" | "connected" | "disconnected";
const LiveContext = createContext({ connection: "connecting" as Connection, synchronized: false, serverNow: () => Date.now() });
export const useLive = () => useContext(LiveContext);

export function LiveProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const enabled = pathname !== "/login" && pathname !== "/acceso-denegado";
  const [connection, setConnection] = useState<Connection>("connecting");
  const [synchronized, setSynchronized] = useState(false);
  const clock = useRef<{ server: number; monotonic: number } | null>(null);
  const [serverNow] = useState(() => () => clock.current
    ? clock.current.server + performance.now() - clock.current.monotonic
    : Date.now());

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let client: ReturnType<typeof createClient<Database>> | undefined;
    let authTimer: ReturnType<typeof setTimeout>;
    let authenticating = false;
    let currentToken: string | null = null;
    const controller = new AbortController();

    async function authenticate() {
      if (authenticating || disposed) return;
      authenticating = true;
      clearTimeout(authTimer);
      try {
        const started = Date.now();
        const response = await fetch("/api/realtime/session", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) { router.replace("/login"); return; }
        if (!response.ok) throw new Error("Conexión no disponible");
        const session = await response.json() as { accessToken: string; expiresAt: number; serverNow: number };
        if (disposed) return;
        const ended = Date.now();
        clock.current = { server: ended + serverClockOffset(session.serverNow, started, ended), monotonic: performance.now() };
        setSynchronized(true);
        currentToken = session.accessToken;
        if (!client) {
          client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
            accessToken: async () => currentToken,
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          });
          await client.realtime.setAuth(session.accessToken);
          if (disposed) return;
          client.channel("dircom-dashboard")
            .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, (event) => {
              const row = event.eventType === "DELETE" ? event.old : event.new;
              announceChange({ scope: "activities", activityId: row.id as string | undefined });
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "activity_messages" }, (event) => {
              const row = event.eventType === "DELETE" ? event.old : event.new;
              announceChange({ scope: "activities", activityId: row.activity_id as string | undefined });
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "voting_rounds" }, () => announceChange({ scope: "voting" }))
            .subscribe((status) => {
              if (disposed) return;
              setConnection(status === "SUBSCRIBED" ? "connected" : "disconnected");
              if (status === "SUBSCRIBED") {
                announceChange({ scope: "activities" });
                announceChange({ scope: "voting" });
              }
            });
        } else {
          await client.realtime.setAuth(session.accessToken);
        }
        // The credential stays in the SDK's memory, never localStorage.
        authTimer = setTimeout(authenticate, Math.max(10_000, session.expiresAt * 1000 - serverNow() - 60_000));
      } catch {
        if (!disposed) {
          setConnection("disconnected");
          authTimer = setTimeout(authenticate, 15_000);
        }
      } finally { authenticating = false; }
    }
    function resume() {
      if (document.visibilityState === "visible") void authenticate();
    }
    void authenticate();
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(authTimer);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
      void client?.removeAllChannels();
    };
  }, [enabled, serverNow, router]);

  return <LiveContext.Provider value={{ connection, synchronized, serverNow }}>{children}</LiveContext.Provider>;
}
