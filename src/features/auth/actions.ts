"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/validators/auth";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function ensureConfigured(): ActionResult | null {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }
  return null;
}

export async function loginAction(
  input: LoginInput
): Promise<ActionResult> {
  const configError = ensureConfigured();
  if (configError) return configError;

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/dashboard");
}

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult> {
  const configError = ensureConfigured();
  if (configError) return configError;

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();

  const { data: isValid, error: inviteError } = await admin.rpc(
    "validate_and_consume_invite",
    { invite_code: parsed.data.inviteCode }
  );

  if (inviteError) {
    return {
      success: false,
      error: "Unable to validate invite code. Please try again.",
    };
  }

  if (!isValid) {
    return {
      success: false,
      error: "Invalid, expired, or fully used invite code.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        invite_code: parsed.data.inviteCode,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
