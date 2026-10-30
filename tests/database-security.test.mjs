import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL engine, simulated Supabase-owned schemas. This tests SQL/RLS,
// not successful Supabase HTTP authentication or the deployed GoTrue version.
test("migraciones y permisos en PostgreSQL local", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, email text, phone text, encrypted_password text, raw_app_meta_data jsonb default '{}'::jsonb);
    create table auth.sessions (id uuid primary key, user_id uuid references auth.users(id) on delete cascade, created_at timestamptz default clock_timestamp(), not_after timestamptz);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth, storage, public to anon, authenticated, service_role;
    grant execute on function auth.jwt(), auth.uid() to authenticated;
    create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
  `);
  for (const file of [
    "202610130001_stage2.sql",
    "202610130002_avatars.sql",
    "202610130003_admin_password.sql",
    "202610130004_server_avatar_reads.sql",
    "202610300001_birthdays.sql",
    "202610300002_voting.sql",
    "202610300003_activities.sql",
  ])
    await db.exec(
      await readFile(
        new URL(`../supabase/migrations/${file}`, import.meta.url),
        "utf8",
      ),
    );
  async function account(username, role = "employee", birth = {}) {
    const id = randomUUID();
    await db.transaction(async (tx) => {
      await tx.query(
        "insert into auth.users(id,email,encrypted_password) values($1,$2,'native-test-hash')",
        [id, `${id.replaceAll("-", "")}@auth.dircom.invalid`],
      );
      await tx.query(
        "update auth.users set raw_app_meta_data=$2::jsonb where id=$1",
        [
          id,
          JSON.stringify({
            dircom_profile: {
              username,
              first_name: "Persona",
              last_name: username,
              role,
              ...birth,
            },
          }),
        ],
      );
    });
    return id;
  }
  async function session(id) {
    const sid = randomUUID();
    await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [
      sid,
      id,
    ]);
    return sid;
  }
  async function asUser(id, sid, fn) {
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({
        sub: id,
        session_id: sid,
        role: "authenticated",
        user_metadata: { role: "admin" },
      }),
    ]);
    await db.exec("set role authenticated");
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  }
  const root = await account("administrador", "admin"),
    emp = await account("empleado"),
    other = await account("colega");
  let sid = await session(emp);

  await t.test(
    "alta atómica de Auth y perfil, sin payload de perfil en metadata final",
    async () => {
      const row = await db.query(
        "select p.role,u.raw_app_meta_data from public.profiles p join auth.users u on u.id=p.id where p.id=$1",
        [emp],
      );
      assert.equal(row.rows[0].role, "employee");
      assert.deepEqual(row.rows[0].raw_app_meta_data, {});
    },
  );
  await t.test("username duplicado revierte también la fila Auth", async () => {
    const before = (await db.query("select count(*)::int as n from auth.users"))
      .rows[0].n;
    await assert.rejects(account("empleado"));
    assert.equal(
      (await db.query("select count(*)::int as n from auth.users")).rows[0].n,
      before,
    );
  });
  await t.test("no se crean administradores duplicados", async () => {
    await assert.rejects(account("otro.admin", "admin"));
  });
  await t.test(
    "restricciones de cumpleaños rechazan fechas incompletas o imposibles",
    async () => {
      for (const birth of [
        { birthday_day: 31, birthday_month: 4 },
        { birthday_day: 30, birthday_month: 2 },
        { birthday_day: 2 },
        { birthday_month: 5 },
      ])
        await assert.rejects(
          account("fecha" + randomUUID().slice(0, 8), "employee", birth),
        );
      await account("bisiesto", "employee", {
        birthday_day: 29,
        birthday_month: 2,
      });
    },
  );
  await t.test(
    "anon no puede consultar perfiles ni resolver usuarios",
    async () => {
      await db.exec("set role anon");
      try {
        await assert.rejects(db.query("select id from public.profiles"));
        await assert.rejects(
          db.query("select public.dircom_resolve_username('empleado')"),
        );
      } finally {
        await db.exec("reset role");
      }
    },
  );
  await t.test(
    "empleado lee directorio público interno, no columnas privadas",
    async () =>
      asUser(emp, sid, async () => {
        assert.ok(
          (await db.query("select * from public.employee_directory")).rows
            .length >= 3,
        );
        await assert.rejects(
          db.query("select username,role,is_active from public.profiles"),
        );
        const own = await db.query("select * from public.dircom_my_profile()");
        assert.equal(own.rows.length, 1);
        assert.equal(own.rows[0].id, emp);
        assert.equal(own.rows[0].role, "employee");
      }),
  );
  await t.test(
    "empleado no puede escribir perfiles ni permisos, ni emitir autorización de contraseña",
    async () =>
      asUser(emp, sid, async () => {
        await assert.rejects(
          db.query("update public.profiles set role='admin' where id=$1", [
            emp,
          ]),
        );
        await assert.rejects(
          db.query(
            "update public.profiles set first_name='Otra persona' where id=$1",
            [other],
          ),
        );
        await assert.rejects(
          db.query("delete from public.profiles where id=$1", [other]),
        );
        await assert.rejects(
          db.query("select public.dircom_issue_password_update($1)", [emp]),
        );
      }),
  );
  await t.test(
    "administrador principal no se desactiva ni elimina; el role es inmutable",
    async () => {
      await assert.rejects(
        db.query("update public.profiles set is_active=false where id=$1", [
          root,
        ]),
      );
      await assert.rejects(
        db.query("delete from auth.users where id=$1", [root]),
      );
      await assert.rejects(
        db.query("update public.profiles set role='admin' where id=$1", [emp]),
      );
    },
  );
  await t.test(
    "contraseña del administrador: permiso exclusivo del backend y sesión revocada",
    async () => {
      const oldSession = await session(root);
      await asUser(root, oldSession, async () => {
        await assert.rejects(
          db.query("select public.dircom_issue_admin_password_update($1)", [
            root,
          ]),
        );
      });
      await asUser(emp, sid, async () => {
        await assert.rejects(
          db.query("select public.dircom_issue_admin_password_update($1)", [
            root,
          ]),
        );
      });
      await db.exec("set role service_role");
      let nonce;
      try {
        await assert.rejects(
          db.query("select public.dircom_issue_admin_password_update($1)", [
            emp,
          ]),
        );
        nonce = (
          await db.query(
            "select public.dircom_issue_admin_password_update($1) as nonce",
            [root],
          )
        ).rows[0].nonce;
      } finally {
        await db.exec("reset role");
      }
      await db.transaction(async (tx) => {
        await tx.query(
          "update auth.users set encrypted_password='panel-native-root' where id=$1",
          [root],
        );
        await tx.query(
          "update auth.users set raw_app_meta_data=jsonb_build_object('dircom_password_nonce',$2::text) where id=$1",
          [root, nonce],
        );
      });
      await asUser(root, oldSession, async () => {
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows
            .length,
          0,
        );
      });
      assert.equal(
        (
          await db.query(
            "select encrypted_password from auth.users where id=$1",
            [emp],
          )
        ).rows[0].encrypted_password,
        "native-test-hash",
      );
    },
  );
  await t.test(
    "recuperación principal requiere permiso SQL y revoca la sesión antigua",
    async () => {
      const rootSession = await session(root);
      await assert.rejects(
        db.query("select public.dircom_issue_password_update($1)", [root]),
      );
      await assert.rejects(
        db.query(
          "update auth.users set encrypted_password='unpermitted-root' where id=$1",
          [root],
        ),
      );
      const permit = (
        await db.query(`
        insert into dircom_private.password_updates (user_id, nonce, expires_at)
        select user_id, gen_random_uuid(), clock_timestamp() + interval '3 minutes'
        from dircom_private.primary_administrator
        on conflict (user_id) do update
        set nonce = excluded.nonce, expires_at = excluded.expires_at
        returning user_id, nonce
      `)
      ).rows[0];
      assert.equal(permit.user_id, root);
      await db.transaction(async (tx) => {
        await tx.query(
          "update auth.users set encrypted_password='recovered-native-root' where id=$1",
          [root],
        );
        await tx.query(
          "update auth.users set raw_app_meta_data=jsonb_build_object('dircom_password_nonce',$2::text) where id=$1",
          [root, permit.nonce],
        );
      });
      await asUser(root, rootSession, async () => {
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows
            .length,
          0,
        );
      });
      await asUser(root, await session(root), async () => {
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows[0]
            .role,
          "admin",
        );
      });
      assert.equal(
        (
          await db.query(
            "select * from dircom_private.password_updates where user_id=$1",
            [root],
          )
        ).rows.length,
        0,
      );
    },
  );
  await t.test(
    "cuenta desactivada pierde acceso incluso con JWT y sesión previos",
    async () => {
      await db.query("update public.profiles set is_active=false where id=$1", [
        emp,
      ]);
      await asUser(emp, sid, async () => {
        assert.equal(
          (await db.query("select * from public.employee_directory")).rows
            .length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows
            .length,
          0,
        );
      });
      assert.equal(
        (
          await db.query(
            "select public.dircom_resolve_username('empleado') as id",
          )
        ).rows[0].id,
        null,
      );
    },
  );
  await t.test(
    "reactivar no restaura sesiones viejas; una sesión nueva funciona",
    async () => {
      await db.query("update public.profiles set is_active=true where id=$1", [
        emp,
      ]);
      await asUser(emp, sid, async () =>
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows
            .length,
          0,
        ),
      );
      sid = await session(emp);
      await asUser(emp, sid, async () =>
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows
            .length,
          1,
        ),
      );
    },
  );
  await t.test(
    "contraseña sin nonce administrativo no se puede cambiar",
    async () => {
      await assert.rejects(
        db.query(
          "update auth.users set encrypted_password='unauthorized' where id=$1",
          [emp],
        ),
      );
      assert.equal(
        (
          await db.query(
            "select encrypted_password from auth.users where id=$1",
            [emp],
          )
        ).rows[0].encrypted_password,
        "native-test-hash",
      );
    },
  );
  await t.test(
    "contraseña autorizada: orden real password primero, metadata después, y revocación",
    async () => {
      const nonce = (
        await db.query(
          "select public.dircom_issue_password_update($1) as nonce",
          [emp],
        )
      ).rows[0].nonce;
      await db.transaction(async (tx) => {
        await tx.query(
          "update auth.users set encrypted_password='new-native-hash' where id=$1",
          [emp],
        );
        await tx.query(
          "update auth.users set raw_app_meta_data=jsonb_build_object('dircom_password_nonce',$2::text) where id=$1",
          [emp, nonce],
        );
      });
      await asUser(emp, sid, async () =>
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows
            .length,
          0,
        ),
      );
      sid = await session(emp);
      await asUser(emp, sid, async () =>
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows
            .length,
          1,
        ),
      );
      assert.deepEqual(
        (
          await db.query(
            "select raw_app_meta_data from auth.users where id=$1",
            [emp],
          )
        ).rows[0].raw_app_meta_data,
        {},
      );
      await assert.rejects(
        db.transaction(async (tx) => {
          await tx.query(
            "update auth.users set encrypted_password='replayed' where id=$1",
            [emp],
          );
          await tx.query(
            "update auth.users set raw_app_meta_data=jsonb_build_object('dircom_password_nonce',$2::text) where id=$1",
            [emp, nonce],
          );
        }),
      );
    },
  );
  await t.test("identidad técnica de correo es inmutable", async () => {
    await assert.rejects(
      db.query(
        "update auth.users set email='personal@example.test' where id=$1",
        [emp],
      ),
    );
  });
  await t.test(
    "sesión eliminada pierde acceso antes de expirar el JWT",
    async () => {
      const temporary = await session(emp);
      await db.query("delete from auth.sessions where id=$1", [temporary]);
      await asUser(emp, temporary, async () =>
        assert.equal(
          (await db.query("select * from public.dircom_my_profile()")).rows
            .length,
          0,
        ),
      );
    },
  );
  await t.test(
    "bucket privado: lectura y escritura de archivos solo desde el backend",
    async () => {
      const path = `${other}/${randomUUID()}.webp`,
        oldPath = `${other}/${randomUUID()}.webp`;
      await db.query("update public.profiles set avatar_path=$2 where id=$1", [
        other,
        path,
      ]);
      await db.query(
        "insert into storage.objects(bucket_id,name) values('dircom-avatars',$1),('dircom-avatars',$2)",
        [path, oldPath],
      );
      assert.equal(
        (
          await db.query(
            "select public from storage.buckets where id='dircom-avatars'",
          )
        ).rows[0].public,
        false,
      );
      await asUser(emp, sid, async () => {
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          0,
        );
        await assert.rejects(
          db.query(
            "insert into storage.objects(bucket_id,name) values('dircom-avatars','forged')",
          ),
        );
      });
      await db.query("update public.profiles set is_active=false where id=$1", [
        other,
      ]);
      await asUser(emp, sid, async () =>
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          0,
        ),
      );
    },
  );
  await t.test(
    "limitador persiste y rechaza el noveno intento del mismo usuario",
    async () => {
      for (let i = 0; i < 8; i++)
        assert.equal(
          (
            await db.query(
              "select public.dircom_consume_login_budget($1) as allowed",
              [["account:test", "ip:test", "global"]],
            )
          ).rows[0].allowed,
          true,
        );
      assert.equal(
        (
          await db.query(
            "select public.dircom_consume_login_budget($1) as allowed",
            [["account:test", "ip:test", "global"]],
          )
        ).rows[0].allowed,
        false,
      );
    },
  );
  await t.test(
    "celebraciones de cumpleanos: lectura para miembros activos y escritura protegida",
    async () => {
      const emp1 = await account("bday1");
      const sid1 = await session(emp1);
      const emp2 = await account("bday2");
      const celId = randomUUID();
      await db.query(
        "insert into public.birthday_celebrations(id, employee_id, title, invitation, starts_at, location) values($1, $2, 'Festejo bday2', 'Invitacion test', now() + interval '2 days', 'Oficina')",
        [celId, emp2],
      );
      await asUser(emp1, sid1, async () => {
        const rows = (await db.query("select * from public.birthday_celebrations")).rows;
        assert.equal(rows.length, 1);
        assert.equal(rows[0].title, "Festejo bday2");
        await assert.rejects(
          db.query(
            "insert into public.birthday_celebrations(employee_id, title, invitation, starts_at, location) values($1, 'Hacked', 'Hack', now(), 'Nowhere')",
            [emp1],
          ),
        );
      });
      // Inactive employee celebration is hidden
      await db.query("update public.profiles set is_active=false where id=$1", [emp2]);
      await asUser(emp1, sid1, async () => {
        const rows = (await db.query("select * from public.birthday_celebrations")).rows;
        assert.equal(rows.length, 0);
      });
    },
  );
  await t.test(
    "votacion semanal: voto unico, anonimo, sin auto-voto ni participacion de admin",
    async () => {
      const adminRow = (
        await db.query(
          "select id from public.profiles where role = 'admin' limit 1",
        )
      ).rows[0];
      const adminId = adminRow.id;
      const adminSid = await session(adminId);
      const voter1 = await account("voter1");
      const voter1Sid = await session(voter1);
      const voter2 = await account("voter2");
      const voter2Sid = await session(voter2);
      const roundId = randomUUID();

      // Create an open voting round of 15 minutes
      await db.query(
        "insert into public.voting_rounds(id, title, week_label, status, opens_at, closes_at) values($1, 'Empleado de la semana', 'Semana 1', 'open', now(), now() + interval '15 minutes')",
        [roundId],
      );

      // 1. voter1 votes for voter2: success
      await asUser(voter1, voter1Sid, async () => {
        const res = await db.query(
          "select dircom_private.cast_vote($1, $2) as voted",
          [roundId, voter2],
        );
        assert.equal(res.rows[0].voted, true);
      });

      // 2. voter1 tries to vote again in the same round: rejected
      await asUser(voter1, voter1Sid, async () => {
        await assert.rejects(
          db.query("select dircom_private.cast_vote($1, $2)", [roundId, voter2]),
          /Ya has emitido tu voto/,
        );
      });

      // 3. voter2 tries to vote for himself: rejected
      await asUser(voter2, voter2Sid, async () => {
        await assert.rejects(
          db.query("select dircom_private.cast_vote($1, $2)", [roundId, voter2]),
          /No puedes votar por ti mismo/,
        );
      });

      // 4. Admin tries to vote: rejected
      await asUser(adminId, adminSid, async () => {
        await assert.rejects(
          db.query("select dircom_private.cast_vote($1, $2)", [roundId, voter1]),
          /Solo los empleados activos pueden votar/,
        );
      });

      // 5. voter2 tries to vote for admin: rejected
      await asUser(voter2, voter2Sid, async () => {
        await assert.rejects(
          db.query("select dircom_private.cast_vote($1, $2)", [roundId, adminId]),
          /El candidato seleccionado no es valido/,
        );
      });

      // 6. Check anonymity and RLS
      await asUser(voter1, voter1Sid, async () => {
        // Can read their own ballot cast
        const ballots = (await db.query("select * from public.voting_ballots_cast")).rows;
        assert.equal(ballots.length, 1);
        assert.equal(ballots[0].voter_id, voter1);

        // Cannot read voting_votes (urna secreta)
        await assert.rejects(
          db.query("select * from public.voting_votes"),
          /permission denied/,
        );
      });

      // 7. Expired round: voting rejected
      const expiredRoundId = randomUUID();
      await db.query(
        "insert into public.voting_rounds(id, title, week_label, status, opens_at, closes_at) values($1, 'Ronda pasada', 'Semana 0', 'open', now() - interval '30 minutes', now() - interval '15 minutes')",
        [expiredRoundId],
      );
      await asUser(voter2, voter2Sid, async () => {
        await assert.rejects(
          db.query("select dircom_private.cast_vote($1, $2)", [expiredRoundId, voter1]),
          /El tiempo para votar ha finalizado/,
        );
      });
    },
  );
  await t.test(
    "actividades rapidas: lectura para miembros activos y escritura protegida",
    async () => {
      const emp1 = await account("act_user1");
      const sid1 = await session(emp1);
      const emp2 = await account("act_user2");
      const actId = randomUUID();
      const msgId = randomUUID();

      await db.query(
        "insert into public.activities(id, title, category, description, creator_id, status) values($1, 'Pedido empanadas', 'food', 'Anotar pedidos', $2, 'open')",
        [actId, emp2],
      );
      await db.query(
        "insert into public.activity_messages(id, activity_id, author_id, text) values($1, $2, $3, '4 de pollo')",
        [msgId, actId, emp2],
      );

      // Active member can read activities and messages
      await asUser(emp1, sid1, async () => {
        const acts = (await db.query("select * from public.activities")).rows;
        assert.equal(acts.length, 1);
        assert.equal(acts[0].title, "Pedido empanadas");

        const msgs = (await db.query("select * from public.activity_messages")).rows;
        assert.equal(msgs.length, 1);
        assert.equal(msgs[0].text, "4 de pollo");

        // Direct client insert without service_role is rejected
        await assert.rejects(
          db.query(
            "insert into public.activities(title, category, description, creator_id) values('Hack', 'food', 'Test', $1)",
            [emp1],
          ),
          /permission denied/,
        );
      });
    },
  );
});
