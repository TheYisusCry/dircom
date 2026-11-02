import { getSessionProfile } from "@/lib/auth/session";
import { loadDashboard, type DashboardScope } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ scope: string }> }) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  const profile = await getSessionProfile();
  if (!profile) return Response.json({ error: "Sesión no autorizada." }, { status: 401, headers });
  const { scope } = await context.params;
  if (!["activities", "voting", "birthdays", "coffee"].includes(scope)) {
    return Response.json({ error: "Sección inválida." }, { status: 400, headers });
  }
  try {
    const data = await loadDashboard(profile, scope as DashboardScope);
    return Response.json(data[scope as DashboardScope], { headers });
  } catch {
    return Response.json({ error: "No se pudo actualizar esta sección." }, { status: 503, headers });
  }
}
