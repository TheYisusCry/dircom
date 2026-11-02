"use client";

import { useEffect, useRef, useState } from "react";
import type { ActivityMessage } from "@/types";
import { mergeMessages } from "@/lib/live";
import { onLiveChange, useLive } from "@/components/live/live-provider";
import { ActivityMessages } from "./activity-messages";
import { Button } from "@/components/ui/button";

type MessagePage = { messages: ActivityMessage[]; hasMore: boolean };
const cursorFor = (message: ActivityMessage) => `${message.sentAt}|${message.id}`;

export function ActivityThread({ activityId }: { activityId: string }) {
  const { connection } = useLive();
  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const newest = useRef<ActivityMessage | undefined>(undefined);
  const oldest = useRef<ActivityMessage | undefined>(undefined);
  const busy = useRef(false);
  const loadOlder = useRef<() => void>(() => {});

  useEffect(() => {
    let disposed = false;
    let queued = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function read(older = false) {
      if (disposed || document.visibilityState !== "visible") return;
      if (busy.current) { queued = true; return; }
      busy.current = true;
      setLoading(true);
      try {
        let more = true;
        while (more && !disposed) {
          const anchor = older ? oldest.current : newest.current;
          const suffix = anchor ? `?${older ? "before" : "after"}=${encodeURIComponent(cursorFor(anchor))}` : "";
          const response = await fetch(`/api/activities/${activityId}/messages${suffix}`, { cache: "no-store", signal: controller.signal });
          if (response.status === 401) { window.location.assign("/login"); return; }
          if (!response.ok) throw new Error(response.status === 404 ? "La actividad ya no está disponible." : "No se pudieron actualizar los mensajes.");
          const page = await response.json() as MessagePage;
          if (disposed) return;
          setMessages((current) => mergeMessages(current, page.messages));
          if (older || !anchor) { setHasOlder(page.hasMore); oldest.current = page.messages[0] ?? oldest.current; }
          if (!older) newest.current = page.messages.at(-1) ?? newest.current;
          more = !older && Boolean(anchor) && page.hasMore;
          setError("");
        }
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los mensajes.");
      } finally {
        busy.current = false;
        if (!disposed) {
          setLoading(false);
          if (queued) { queued = false; timer = setTimeout(() => void read(), 150); }
        }
      }
    }
    loadOlder.current = () => void read(true);
    const unsubscribe = onLiveChange((change) => {
      if (change.scope === "activities" && (!change.activityId || change.activityId === activityId)) {
        clearTimeout(timer);
        timer = setTimeout(() => void read(), 100);
      }
    });
    const resume = () => { if (document.visibilityState === "visible") void read(); };
    timer = setTimeout(resume, 0);
    const fallback = setInterval(resume, connection === "connected" ? 300_000 : 15_000);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
      clearInterval(fallback);
      unsubscribe();
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [activityId, connection]);

  return <div>
    <h4 className="mb-3 text-xs font-bold uppercase">Pedidos y notas anotadas</h4>
    {hasOlder && <Button variant="secondary" disabled={loading} onClick={() => loadOlder.current()} className="mb-3 text-xs">Ver mensajes anteriores</Button>}
    {error && <p role="alert" className="mb-3 text-xs text-red-700">{error}</p>}
    {messages.length > 0 ? <ActivityMessages messages={messages} showTime /> : <p className="text-xs text-muted">{loading ? "Cargando mensajes…" : "Aún nadie ha anotado pedidos en esta actividad."}</p>}
  </div>;
}
