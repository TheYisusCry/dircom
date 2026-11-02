import { getSessionProfile } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  if (!(await getSessionProfile())) {
    return Response.json({ error: "Sesión no autorizada." }, { status: 401, headers });
  }
  const client = await createSessionClient();
  // Session identity was checked above. Only the short-lived access token leaves
  // the server; never return a refresh token or the service-role key.
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) return Response.json({ error: "Sesión no disponible." }, { status: 401, headers });
  return Response.json({
    accessToken: data.session.access_token,
    expiresAt: data.session.expires_at,
    serverNow: Date.now(),
  }, { headers });
}
