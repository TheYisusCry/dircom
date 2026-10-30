// Read-only setup diagnostics. Never print keys, credentials or account identities.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !publishable || !secret) {
  console.log(JSON.stringify({ configuration: "missing" }));
  process.exit(1);
}
let networkFailure = false;
const safeFetch = async (input, options) => {
  try {
    return await fetch(input, {
      ...options,
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    networkFailure = true;
    throw new Error("Connection unavailable");
  }
};
const client = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: safeFetch },
});
const error = (value) =>
  value ? { code: value.code ?? null, status: value.status ?? null } : null;
const calls = await Promise.allSettled([
  client.auth.admin.listUsers({ page: 1, perPage: 1 }),
  client.rpc("dircom_can_bootstrap"),
  client.from("profiles").select("id", { count: "exact", head: true }),
  client.storage.getBucket("dircom-avatars"),
  safeFetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: publishable },
  }).then(async (response) => {
    if (!response.ok) return { status: response.status };
    const data = await response.json();
    return {
      status: response.status,
      signupDisabled: data.disable_signup,
      emailAutoConfirm: data.mailer_autoconfirm,
      enabledProviders: Object.entries(data.external ?? {})
        .filter(([, value]) => value === true)
        .map(([name]) => name),
    };
  }),
]);
const [auth, bootstrap, profiles, storage, settings] = calls;
const value = (item) => (item.status === "fulfilled" ? item.value : null);
const bucket = value(storage)?.data;
console.log(
  JSON.stringify(
    {
      networkFailure,
      authAdmin:
        auth.status === "fulfilled"
          ? {
              valid: !auth.value.error,
              totalUsers: auth.value.data?.total,
              error: error(auth.value.error),
            }
          : { failed: true },
      migration:
        bootstrap.status === "fulfilled"
          ? {
              canBootstrap: bootstrap.value.data,
              error: error(bootstrap.value.error),
            }
          : { failed: true },
      profiles:
        profiles.status === "fulfilled"
          ? { count: profiles.value.count, error: error(profiles.value.error) }
          : { failed: true },
      avatars: {
        exists: Boolean(bucket),
        error: error(value(storage)?.error),
        public: bucket?.public,
        fileSizeLimit: bucket?.file_size_limit,
        mimeTypes: bucket?.allowed_mime_types,
      },
      authSettings: value(settings),
    },
    null,
    2,
  ),
);
if (networkFailure) process.exitCode = 2;
