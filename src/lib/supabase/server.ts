import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import {
  publicSupabaseConfig,
  sessionCookieOptions,
  sessionCookieFlags,
} from "./config";
export async function createSessionClient() {
  const store = await cookies();
  const { url, key } = publicSupabaseConfig();
  return createServerClient<Database>(url, key, {
    cookieOptions: sessionCookieOptions(),
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            store.set(name, value, { ...options, ...sessionCookieFlags() }),
          );
        } catch {
          /* Server Components cannot write; proxy refreshes the session. */
        }
      },
    },
  });
}
