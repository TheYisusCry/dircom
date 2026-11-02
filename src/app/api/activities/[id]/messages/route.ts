import { getSessionProfile } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import { UUID_PATTERN } from "@/lib/auth/validation";
import { profileToParticipant } from "@/lib/dates";

export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  if (!(await getSessionProfile())) return Response.json({ error: "Sesión no autorizada." }, { status: 401, headers });
  const { id } = await context.params;
  const params = new URL(request.url).searchParams;
  const before = params.get("before");
  const after = params.get("after");
  const cursor = before || after;
  let cursorTime = "";
  let cursorId = "";
  if (cursor) [cursorTime, cursorId] = cursor.split("|");
  if (!UUID_PATTERN.test(id) || (before && after) || (cursor && (
    !UUID_PATTERN.test(cursorId ?? "") || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(cursorTime) || !Number.isFinite(Date.parse(cursorTime))
  ))) return Response.json({ error: "Consulta inválida." }, { status: 400, headers });
  const client = await createSessionClient();
  const activity = await client.from("activities").select("id").eq("id", id).maybeSingle();
  if (activity.error) return Response.json({ error: "No se pudo consultar la actividad." }, { status: 503, headers });
  if (!activity.data) return Response.json({ error: "La actividad ya no está disponible." }, { status: 404, headers });
  let query = client.from("activity_messages")
    .select("id, text, created_at, author:profiles!activity_messages_author_id_fkey(id, first_name, last_name, job_title, avatar_path)")
    .eq("activity_id", id)
    .order("created_at", { ascending: Boolean(after) })
    .order("id", { ascending: Boolean(after) })
    .limit(51);
  if (cursor) {
    const operator = after ? "gt" : "lt";
    query = query.or(`created_at.${operator}.${cursorTime},and(created_at.eq.${cursorTime},id.${operator}.${cursorId})`);
  }
  const result = await query;
  if (result.error) return Response.json({ error: "No se pudieron cargar los mensajes." }, { status: 503, headers });
  const rows = (result.data ?? []).slice(0, 50);
  if (!after) rows.reverse();
  return Response.json({
    messages: rows.map((row) => ({ id: row.id, text: row.text, sentAt: row.created_at, author: profileToParticipant(Array.isArray(row.author) ? row.author[0] : row.author) })),
    hasMore: (result.data?.length ?? 0) > 50,
  }, { headers });
}
