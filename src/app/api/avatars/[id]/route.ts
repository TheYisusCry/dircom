import { getSessionProfile } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_PATTERN } from "@/lib/auth/validation";
import { AVATAR_BUCKET } from "@/lib/auth/photos";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getSessionProfile();
  if (!viewer) {
    return new Response(null, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const client =
    viewer.role === "admin" ? createAdminClient() : await createSessionClient();
  const row = await client
    .from("profiles")
    .select("avatar_path")
    .eq("id", id)
    .maybeSingle();

  const path = row.data?.avatar_path;
  if (
    row.error ||
    !path ||
    !new RegExp(`^${id}/[0-9a-f-]{36}\\.webp$`, "i").test(path)
  ) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const photoUuid = path.split("/")[1] ?? path;
  const etag = `"${photoUuid}"`;
  const ifNoneMatch = request.headers.get("if-none-match");

  const cacheHeaders = {
    "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
    "ETag": etag,
    "Vary": "Cookie, Accept-Encoding",
    "X-Content-Type-Options": "nosniff",
  };

  if (
    ifNoneMatch &&
    (ifNoneMatch === etag || ifNoneMatch.replace(/^W\//, "") === etag)
  ) {
    return new Response(null, {
      status: 304,
      headers: cacheHeaders,
    });
  }

  const file = await createAdminClient()
    .storage.from(AVATAR_BUCKET)
    .download(path);

  if (file.error || !file.data) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  return new Response(await file.data.arrayBuffer(), {
    headers: {
      "Content-Type": "image/webp",
      ...cacheHeaders,
    },
  });
}
