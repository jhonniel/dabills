"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured, supabaseMissingMessage } from "@/lib/env";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/validators/auth";
import {
  activateAccountSchema,
  type ActivateAccountInput,
} from "@/validators/admin-user";
import {
  readAdminUsers,
  setDemoUserAccountStatus,
} from "@/lib/admin/demo-store";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function ensureConfigured(): ActionResult | null {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: supabaseMissingMessage(),
    };
  }
  return null;
}

export async function loginAction(
  input: LoginInput
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "auth:login",
    limit: 10,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

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

  return { success: true };
}

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "auth:register",
    limit: 5,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

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

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function activateAccountAction(input: ActivateAccountInput & {
  demoToken?: string | null;
}): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "auth:activate",
    limit: 10,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const parsed = activateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid password",
    };
  }

  // Demo activation via emailed token
  if (!isSupabaseConfigured() || input.demoToken) {
    if (!input.demoToken) {
      return { success: false, error: "Activation token is required" };
    }
    const users = await readAdminUsers();
    const user = users.find((item) => item.activation_token === input.demoToken);
    if (!user) {
      return { success: false, error: "Invalid or expired activation link" };
    }
    await setDemoUserAccountStatus(user.id, "active", {
      activation_token: null,
    });
    return { success: true };
  }

  const configError = ensureConfigured();
  if (configError) return configError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Open the activation link from your email first, then set a password.",
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (passwordError) {
    return { success: false, error: passwordError.message };
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ account_status: "active" })
    .eq("id", user.id);

  return { success: true };
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
