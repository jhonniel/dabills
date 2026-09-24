import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch (error) {
    // Static generation / build has no request cookies — use an empty store.
    if (
      !(
        error instanceof Error &&
        /Dynamic server usage|cookies/i.test(error.message)
      )
    ) {
      console.warn("createClient cookies unavailable", error);
    }
    cookieStore = {
      getAll: () => [],
      set: () => undefined,
      get: () => undefined,
      has: () => false,
      delete: () => undefined,
      size: 0,
      [Symbol.iterator]: function* () {},
    } as unknown as Awaited<ReturnType<typeof cookies>>;
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — middleware will refresh sessions.
        }
      },
    },
  });
}
