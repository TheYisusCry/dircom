import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const enabled = process.env.DIRCOM_RUN_LIVE_TESTS === "yes" && url && key;

// Read-only checks can run before bootstrap. No accounts, tokens or keys are logged.
test(
  "Supabase real: configuración privada sin administrador",
  { skip: !enabled },
  async (t) => {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, options) =>
          fetch(input, { ...options, signal: AbortSignal.timeout(12000) }),
      },
    });
    await t.test(
      "registro público y acceso anónimo deshabilitados",
      async () => {
        const response = await fetch(
          `${url.replace(/\/$/, "")}/auth/v1/settings`,
          { headers: { apikey: key }, signal: AbortSignal.timeout(12000) },
        );
        assert.equal(response.status, 200);
        const settings = await response.json();
        assert.equal(settings.disable_signup, true);
        assert.equal(settings.mailer_autoconfirm, false);
        assert.equal(settings.external.email, true);
        assert.deepEqual(
          Object.entries(settings.external)
            .filter(([, value]) => value === true)
            .map(([name]) => name),
          ["email"],
        );
      },
    );
    await t.test("visitante sin sesión no puede leer perfiles", async () => {
      const result = await client.from("profiles").select("id").limit(1);
      assert.equal(result.error?.code, "42501");
    });
    await t.test(
      "visitante no resuelve usernames ni ve perfiles propios",
      async () => {
        const lookup = await client.rpc("dircom_resolve_username", {
          p_username: "setup.inexistente",
        });
        assert.equal(lookup.error?.code, "42501");
        const profile = await client.rpc("dircom_my_profile");
        assert.equal(profile.error?.code, "42501");
      },
    );
    await t.test("visitante no emite permisos de contraseña", async () => {
      const permit = await client.rpc("dircom_issue_password_update", {
        p_user_id: "00000000-0000-0000-0000-000000000000",
      });
      assert.equal(permit.error?.code, "42501");
      const ownAdminPermit = await client.rpc(
        "dircom_issue_admin_password_update",
        {
          p_user_id: "00000000-0000-0000-0000-000000000000",
        },
      );
      assert.equal(ownAdminPermit.error?.code, "42501");
    });
  },
);
