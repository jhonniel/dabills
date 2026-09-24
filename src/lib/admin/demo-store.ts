import { cookies } from "next/headers";

import { DEMO_CATEGORIES } from "@/lib/billing/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AccountStatus,
  ActivityLog,
  Category,
  InviteCode,
  Profile,
} from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuidOrNull(value: string | null | undefined) {
  if (!value || !UUID_RE.test(value)) return null;
  return value;
}

const USERS_COOKIE = "dabills_demo_admin_users_v3";
const INVITES_COOKIE = "dabills_demo_admin_invites";
const ACTIVITY_COOKIE = "dabills_demo_activity_logs";
const CATEGORIES_COOKIE = "dabills_demo_admin_categories";

export type AdminUser = Profile & {
  subscriptions_count?: number;
  /** @deprecated prefer account_status */
  status?: AccountStatus;
  activation_token?: string | null;
};

function withStatus(user: AdminUser): AdminUser {
  const account_status =
    user.account_status ?? user.status ?? ("active" as AccountStatus);
  return {
    ...user,
    code_name: user.code_name ?? null,
    account_status,
    status: account_status,
  };
}

function seedUsers(): AdminUser[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-admin",
      email: "admin@dabills.app",
      full_name: "DaBills Admin",
      code_name: "ADMIN",
      avatar_url: null,
      role: "admin",
      account_status: "active",
      plan_id: null,
      timezone: "UTC",
      notification_email: true,
      notification_in_app: true,
      created_at: now,
      updated_at: now,
      subscriptions_count: 0,
      status: "active",
      activation_token: null,
    },
    {
      id: "demo-user",
      email: "jordan@example.com",
      full_name: "Jordan Lee",
      code_name: "JORDAN",
      avatar_url: null,
      role: "user",
      account_status: "active",
      plan_id: null,
      timezone: "Asia/Manila",
      notification_email: true,
      notification_in_app: true,
      created_at: now,
      updated_at: now,
      subscriptions_count: 8,
      status: "active",
      activation_token: null,
    },
    {
      id: "demo-user-2",
      email: "sam@example.com",
      full_name: "Sam Rivera",
      code_name: "SAMR",
      avatar_url: null,
      role: "user",
      account_status: "active",
      plan_id: null,
      timezone: "UTC",
      notification_email: false,
      notification_in_app: true,
      created_at: now,
      updated_at: now,
      subscriptions_count: 3,
      status: "active",
      activation_token: null,
    },
    {
      id: "demo-user-3",
      email: "alex@example.com",
      full_name: "Alex Kim",
      code_name: null,
      avatar_url: null,
      role: "user",
      account_status: "disabled",
      plan_id: null,
      timezone: "America/New_York",
      notification_email: true,
      notification_in_app: true,
      created_at: now,
      updated_at: now,
      subscriptions_count: 12,
      status: "disabled",
      activation_token: null,
    },
  ];
}

function seedInvites(): InviteCode[] {
  const now = new Date().toISOString();
  return [
    {
      id: "invite-1",
      code: "DABILLS-DEMO",
      created_by: "demo-admin",
      max_uses: 100,
      uses_count: 12,
      expires_at: null,
      is_active: true,
      note: "Phase 1 demo invite",
      created_at: now,
      updated_at: now,
    },
    {
      id: "invite-2",
      code: "FAMILY-2026",
      created_by: "demo-admin",
      max_uses: 5,
      uses_count: 5,
      expires_at: null,
      is_active: false,
      note: "Family pack — exhausted",
      created_at: now,
      updated_at: now,
    },
    {
      id: "invite-3",
      code: "BETA-LAUNCH",
      created_by: "demo-admin",
      max_uses: 50,
      uses_count: 8,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      is_active: true,
      note: "Beta cohort",
      created_at: now,
      updated_at: now,
    },
  ];
}

function seedActivity(): ActivityLog[] {
  const now = Date.now();
  return [
    {
      id: "act-1",
      user_id: "demo-user",
      actor_id: "demo-admin",
      action: "payment.approved",
      entity_type: "payment",
      entity_id: null,
      metadata: { note: "Approved Netflix receipt" },
      ip_address: "127.0.0.1",
      user_agent: "DaBills Admin",
      created_at: new Date(now - 1000 * 60 * 20).toISOString(),
    },
    {
      id: "act-2",
      user_id: null,
      actor_id: "demo-admin",
      action: "invite.created",
      entity_type: "invite_code",
      entity_id: "invite-3",
      metadata: { code: "BETA-LAUNCH" },
      ip_address: "127.0.0.1",
      user_agent: "DaBills Admin",
      created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "act-3",
      user_id: "demo-user-2",
      actor_id: "demo-admin",
      action: "user.role_updated",
      entity_type: "profile",
      entity_id: "demo-user-2",
      metadata: { role: "user" },
      ip_address: "127.0.0.1",
      user_agent: "DaBills Admin",
      created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    },
  ];
}

async function readJsonCookie<T>(name: string, fallback: T): Promise<T> {
  const store = await cookies();
  const raw = store.get(name)?.value;
  if (!raw) return fallback;
  try {
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonCookie<T>(name: string, value: T) {
  const store = await cookies();
  store.set(name, encodeURIComponent(JSON.stringify(value)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readAdminUsers() {
  const users = await readJsonCookie(USERS_COOKIE, seedUsers());
  return users.map(withStatus);
}

export async function writeAdminUsers(users: AdminUser[]) {
  await writeJsonCookie(USERS_COOKIE, users.map(withStatus));
}

export async function createDemoAdminUser(input: {
  email?: string | null;
  fullName: string;
}) {
  const users = await readAdminUsers();
  const emailRaw = input.email?.trim().toLowerCase() ?? "";
  const email = emailRaw || null;
  if (email && users.some((user) => user.email?.toLowerCase() === email)) {
    throw new Error("A user with this email already exists");
  }

  const now = new Date().toISOString();
  const created: AdminUser = {
    id: crypto.randomUUID(),
    email,
    full_name: input.fullName.trim(),
    code_name: null,
    avatar_url: null,
    role: "user",
    account_status: "pending",
    plan_id: null,
    timezone: "UTC",
    notification_email: true,
    notification_in_app: true,
    created_at: now,
    updated_at: now,
    subscriptions_count: 0,
    status: "pending",
    activation_token: crypto.randomUUID(),
  };

  await writeAdminUsers([created, ...users]);
  return created;
}

export async function setDemoUserEmail(userId: string, email: string) {
  const users = await readAdminUsers();
  const normalized = email.trim().toLowerCase();
  const clash = users.find(
    (user) =>
      user.id !== userId && user.email?.toLowerCase() === normalized
  );
  if (clash) {
    throw new Error("That email is already linked to another user");
  }
  const index = users.findIndex((user) => user.id === userId);
  if (index < 0) return null;
  const next = [...users];
  next[index] = withStatus({
    ...next[index],
    email: normalized,
    updated_at: new Date().toISOString(),
  });
  await writeAdminUsers(next);
  return next[index];
}

export async function setDemoUserCodeName(
  userId: string,
  codeName: string | null
) {
  const users = await readAdminUsers();
  const normalized = codeName?.trim() ? codeName.trim().slice(0, 64) : null;
  if (normalized) {
    const clash = users.find(
      (user) =>
        user.id !== userId &&
        user.code_name?.toLowerCase() === normalized.toLowerCase()
    );
    if (clash) {
      throw new Error("That code name is already linked to another user");
    }
  }
  const index = users.findIndex((user) => user.id === userId);
  if (index < 0) return null;
  const next = [...users];
  next[index] = withStatus({
    ...next[index],
    code_name: normalized,
    updated_at: new Date().toISOString(),
  });
  await writeAdminUsers(next);
  return next[index];
}

export async function setDemoUserAccountStatus(
  userId: string,
  status: AccountStatus,
  extras?: Partial<Pick<AdminUser, "activation_token">>
) {
  const users = await readAdminUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index < 0) return null;
  const next = [...users];
  next[index] = withStatus({
    ...next[index],
    account_status: status,
    status,
    activation_token:
      extras?.activation_token !== undefined
        ? extras.activation_token
        : next[index].activation_token,
    updated_at: new Date().toISOString(),
  });
  await writeAdminUsers(next);
  return next[index];
}

export async function readAdminInvites() {
  return readJsonCookie(INVITES_COOKIE, seedInvites());
}

export async function writeAdminInvites(invites: InviteCode[]) {
  await writeJsonCookie(INVITES_COOKIE, invites);
}

export async function readAdminCategories() {
  return readJsonCookie(CATEGORIES_COOKIE, DEMO_CATEGORIES);
}

export async function writeAdminCategories(categories: Category[]) {
  await writeJsonCookie(CATEGORIES_COOKIE, categories);
}

export async function readActivityLogs() {
  return readJsonCookie(ACTIVITY_COOKIE, seedActivity());
}

export async function appendActivityLog(
  entry: Omit<ActivityLog, "id" | "created_at">
) {
  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("activity_logs")
        .insert({
          user_id: asUuidOrNull(entry.user_id),
          actor_id: asUuidOrNull(entry.actor_id),
          action: entry.action,
          entity_type: entry.entity_type,
          entity_id: asUuidOrNull(entry.entity_id),
          metadata: entry.metadata,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
        })
        .select()
        .single();
      if (!error && data) return data as ActivityLog;
      console.error("appendActivityLog", error?.message);
    } catch (error) {
      console.error("appendActivityLog", error);
    }
    return {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
  }

  const items = await readActivityLogs();
  const created: ActivityLog = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  await writeJsonCookie(ACTIVITY_COOKIE, [created, ...items].slice(0, 200));
  return created;
}
