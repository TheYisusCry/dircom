import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import sharp from "sharp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = process.env.DIRCOM_TEST_ADMIN_USERNAME,
  password = process.env.DIRCOM_TEST_ADMIN_PASSWORD;
const enabled =
  process.env.DIRCOM_RUN_LIVE_TESTS === "yes" &&
  url &&
  pub &&
  secret &&
  username &&
  password;

// Explicit opt-in, staging only. Creates and deletes ONLY its own random fixture.
// Never changes the existing administrator or any existing employee.
test(
  "Supabase real: Auth, perfiles, contraseñas, sesiones y Storage",
  { skip: !enabled },
  async (t) => {
    const options = {
      auth: { persistSession: false, autoRefreshToken: false },
    };
    const cookies = new Map();
    const admin = createClient(url, secret, options),
      root = createClient(url, pub, options),
      anon = createClient(url, pub, options);
    const user = createServerClient(url, pub, {
      cookieOptions: { name: "dircom-session" },
      cookies: {
        getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
        setAll: (items) => {
          for (const { name, value } of items) {
            if (value) cookies.set(name, value);
            else cookies.delete(name);
          }
        },
      },
    });
    const appResponse = (path, authenticated = true) =>
      fetch(
        `${process.env.DIRCOM_TEST_APP_URL || "http://localhost:3000"}${path}`,
        {
          headers: authenticated
            ? {
                Cookie: [...cookies]
                  .map(([name, value]) => `${name}=${value}`)
                  .join("; "),
              }
            : {},
          redirect: "manual",
          signal: AbortSignal.timeout(15000),
        },
      );
    const avatarResponse = (id, authenticated = true) =>
      appResponse(`/api/avatars/${id}`, authenticated);
    const lookup = await admin.rpc("dircom_resolve_username", {
      p_username: username.trim().toLowerCase(),
    });
    assert.equal(
      lookup.error,
      null,
      "El administrador de pruebas debe existir",
    );
    assert.ok(lookup.data);
    const identity = await admin.auth.admin.getUserById(lookup.data);
    const login = await root.auth.signInWithPassword({
      email: identity.data.user.email,
      password,
    });
    assert.equal(login.error, null);
    const rootProfile = await root.rpc("dircom_my_profile");
    assert.equal(rootProfile.data?.[0]?.role, "admin");
    await t.test(
      "permiso de contraseña del administrador exclusivo del servidor",
      async () => {
        const denied = await root.rpc("dircom_issue_admin_password_update", {
          p_user_id: lookup.data,
        });
        assert.equal(denied.error?.code, "42501");
        const permit = await admin.rpc("dircom_issue_admin_password_update", {
          p_user_id: lookup.data,
        });
        assert.equal(permit.error, null);
        assert.ok(permit.data);
        const cancelled = await admin.rpc("dircom_cancel_password_update", {
          p_user_id: lookup.data,
          p_nonce: permit.data,
        });
        assert.equal(cancelled.error, null);
      },
    );
    const fixtureName = `test.${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const fixtureEmail = `${randomUUID().replaceAll("-", "")}@auth.dircom.invalid`;
    // Verify the actual office policy: six characters, no uppercase or symbols.
    const fixturePassword = randomUUID().replaceAll("-", "").slice(0, 6),
      replacement =
        (fixturePassword[0] === "a" ? "b" : "a") + fixturePassword.slice(1);
    let fixtureId, avatarPath;
    try {
      await t.test("creación transaccional de empleado", async () => {
        const created = await admin.auth.admin.createUser({
          email: fixtureEmail,
          password: fixturePassword,
          email_confirm: true,
          app_metadata: {
            dircom_profile: {
              username: fixtureName,
              first_name: "Prueba",
              last_name: "Temporal",
              role: "employee",
              birthday_day: 29,
              birthday_month: 2,
            },
          },
        });
        assert.equal(created.error, null);
        fixtureId = created.data.user.id;
        const row = await admin
          .from("profiles")
          .select("role")
          .eq("id", fixtureId)
          .single();
        assert.equal(row.data.role, "employee");
      });
      assert.ok(fixtureId, "No se pudo crear el fixture");
      await t.test("login correcto y credenciales incorrectas", async () => {
        assert.ok(
          (
            await anon.auth.signInWithPassword({
              email: fixtureEmail,
              password: "Incorrecta!123",
            })
          ).error,
        );
        assert.equal(
          (
            await user.auth.signInWithPassword({
              email: fixtureEmail,
              password: fixturePassword,
            })
          ).error,
          null,
        );
        assert.equal(
          (await user.rpc("dircom_my_profile")).data?.[0]?.id,
          fixtureId,
        );
      });
      await t.test(
        "empleado no puede acceder a las rutas administrativas",
        async () => {
          for (const path of ["/admin/empleados", "/admin/cuenta"]) {
            const response = await appResponse(path);
            assert.equal(response.status, 307);
            assert.equal(
              new URL(response.headers.get("location"), "http://localhost:3000")
                .pathname,
              "/acceso-denegado",
            );
          }
        },
      );
      await t.test(
        "anon sin perfiles; empleado sin modificaciones de role",
        async () => {
          assert.ok((await anon.from("profiles").select("id")).error);
          assert.ok(
            (
              await user
                .from("profiles")
                .update({ role: "admin" })
                .eq("id", fixtureId)
            ).error,
          );
          assert.ok(
            (
              await user.rpc("dircom_issue_password_update", {
                p_user_id: fixtureId,
              })
            ).error,
          );
          assert.ok(
            (
              await anon.rpc("dircom_resolve_username", {
                p_username: fixtureName,
              })
            ).error,
          );
        },
      );
      await t.test(
        "username duplicado no conserva una identidad nueva",
        async () => {
          const duplicate = await admin.auth.admin.createUser({
            email: `${randomUUID().replaceAll("-", "")}@auth.dircom.invalid`,
            password: fixturePassword,
            email_confirm: true,
            app_metadata: {
              dircom_profile: {
                username: fixtureName,
                first_name: "Duplicado",
                last_name: "Temporal",
                role: "employee",
              },
            },
          });
          assert.ok(duplicate.error);
          assert.equal(duplicate.data.user, null);
        },
      );
      await t.test(
        "Auth API de empleado no puede cambiar contraseña",
        async () => {
          assert.ok(
            (await user.auth.updateUser({ password: replacement })).error,
          );
        },
      );
      await t.test(
        "reset administrativo y pérdida de acceso de la sesión anterior",
        async () => {
          const permit = await admin.rpc("dircom_issue_password_update", {
            p_user_id: fixtureId,
          });
          assert.equal(permit.error, null);
          try {
            assert.equal(
              (
                await admin.auth.admin.updateUserById(fixtureId, {
                  password: replacement,
                  app_metadata: { dircom_password_nonce: permit.data },
                })
              ).error,
              null,
            );
          } finally {
            await admin.rpc("dircom_cancel_password_update", {
              p_user_id: fixtureId,
              p_nonce: permit.data,
            });
          }
          const old = await user.rpc("dircom_my_profile");
          assert.ok(old.error || old.data?.length === 0);
          assert.equal(
            (
              await user.auth.signInWithPassword({
                email: fixtureEmail,
                password: replacement,
              })
            ).error,
            null,
          );
        },
      );
      await t.test(
        "fotos privadas: descarga por la aplicación y Storage exclusivo del servidor",
        async () => {
          avatarPath = `${fixtureId}/${randomUUID()}.webp`;
          const image = await sharp({
            create: {
              width: 64,
              height: 64,
              channels: 3,
              background: "#439441",
            },
          })
            .webp()
            .toBuffer();
          assert.equal(
            (
              await admin.storage
                .from("dircom-avatars")
                .upload(avatarPath, image, {
                  contentType: "image/webp",
                  cacheControl: "0",
                })
            ).error,
            null,
          );
          assert.equal(
            (
              await admin
                .from("profiles")
                .update({ avatar_path: avatarPath })
                .eq("id", fixtureId)
            ).error,
            null,
          );
          assert.ok(
            (await user.storage.from("dircom-avatars").download(avatarPath))
              .error,
          );
          assert.equal(
            (await admin.storage.from("dircom-avatars").download(avatarPath))
              .error,
            null,
          );
          const photo = await avatarResponse(fixtureId);
          assert.equal(photo.status, 200);
          assert.equal(photo.headers.get("content-type"), "image/webp");
          assert.match(photo.headers.get("cache-control"), /no-store/);
          assert.ok((await photo.arrayBuffer()).byteLength > 0);
          assert.equal((await avatarResponse(fixtureId, false)).status, 401);
          assert.ok(
            (await anon.storage.from("dircom-avatars").download(avatarPath))
              .error,
          );
          assert.ok(
            (
              await user.storage
                .from("dircom-avatars")
                .upload(`${fixtureId}/${randomUUID()}.webp`, image, {
                  contentType: "image/webp",
                })
            ).error,
          );
        },
      );
      await t.test(
        "desactivación, bloqueo de login y sesiones anteriores",
        async () => {
          assert.equal(
            (
              await admin
                .from("profiles")
                .update({ is_active: false })
                .eq("id", fixtureId)
            ).error,
            null,
          );
          assert.equal(
            (
              await admin.auth.admin.updateUserById(fixtureId, {
                ban_duration: "876000h",
              })
            ).error,
            null,
          );
          const old = await user.rpc("dircom_my_profile");
          assert.ok(old.error || old.data?.length === 0);
          assert.ok(
            (await user.storage.from("dircom-avatars").download(avatarPath))
              .error,
          );
          assert.equal((await avatarResponse(fixtureId)).status, 401);
          assert.ok(
            (
              await anon.auth.signInWithPassword({
                email: fixtureEmail,
                password: replacement,
              })
            ).error,
          );
        },
      );
      await t.test("reactivación requiere nueva sesión", async () => {
        assert.equal(
          (
            await admin.auth.admin.updateUserById(fixtureId, {
              ban_duration: "none",
            })
          ).error,
          null,
        );
        assert.equal(
          (
            await admin
              .from("profiles")
              .update({ is_active: true })
              .eq("id", fixtureId)
          ).error,
          null,
        );
        const old = await user.rpc("dircom_my_profile");
        assert.ok(old.error || old.data?.length === 0);
        assert.equal(
          (
            await user.auth.signInWithPassword({
              email: fixtureEmail,
              password: replacement,
            })
          ).error,
          null,
        );
        assert.equal(
          (await user.rpc("dircom_my_profile")).data?.[0]?.id,
          fixtureId,
        );
      });
    } finally {
      await user.auth.signOut({ scope: "local" });
      await root.auth.signOut({ scope: "local" });
      if (avatarPath)
        await admin.storage.from("dircom-avatars").remove([avatarPath]);
      if (fixtureId) {
        const deleted = await admin.auth.admin.deleteUser(fixtureId);
        assert.equal(
          deleted.error,
          null,
          "Revisa el fixture temporal en staging si no se pudo limpiar",
        );
      }
    }
  },
);
