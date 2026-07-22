"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/guard";
import {
  appendActivityLog,
  readAdminCategories,
  readAdminInvites,
  readAdminUsers,
  writeAdminCategories,
  writeAdminInvites,
  writeAdminUsers,
} from "@/lib/admin/demo-store";
import { isSupabaseConfigured } from "@/lib/env";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category, InviteCode, UserRole } from "@/types";
import { inviteCodeSchema } from "@/validators/invite";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/invites");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/logs");
  revalidatePath("/admin/emails");
}

export async function adminCreateInviteAction(input: {
  code: string;
  maxUses?: number | null;
  expiresAt?: string | null;
  note?: string | null;
}): Promise<ActionResult<InviteCode>> {
  const guard = await enforceMutationGuard({
    action: "admin:invite-create",
    limit: 20,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = inviteCodeSchema.safeParse({
    code: input.code,
    maxUses: input.maxUses,
    expiresAt: input.expiresAt,
    note: input.note,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid invite",
    };
  }

  const code = parsed.data.code.trim().toUpperCase();

  if (!isSupabaseConfigured() || session.isDemo) {
    const invites = await readAdminInvites();
    if (invites.some((item) => item.code === code)) {
      return { success: false, error: "Invite code already exists" };
    }

    const created: InviteCode = {
      id: crypto.randomUUID(),
      code,
      created_by: session.userId,
      max_uses: parsed.data.maxUses ?? null,
      uses_count: 0,
      expires_at: parsed.data.expiresAt ?? null,
      is_active: true,
      note: parsed.data.note ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await writeAdminInvites([created, ...invites]);
    await appendActivityLog({
      user_id: null,
      actor_id: session.userId,
      action: "invite.created",
      entity_type: "invite_code",
      entity_id: created.id,
      metadata: { code },
      ip_address: null,
      user_agent: "admin",
    });
    revalidateAdmin();
    return { success: true, data: created };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .insert({
      code,
      max_uses: parsed.data.maxUses ?? null,
      expires_at: parsed.data.expiresAt ?? null,
      note: parsed.data.note ?? null,
      created_by: session.userId,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to create invite" };
  }

  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: "invite.created",
    entity_type: "invite_code",
    entity_id: (data as InviteCode).id,
    metadata: { code },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true, data: data as InviteCode };
}

export async function adminToggleInviteAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await requireAdmin();
  const invites = await readAdminInvites();
  const next = invites.map((item) =>
    item.id === id
      ? { ...item, is_active: isActive, updated_at: new Date().toISOString() }
      : item
  );
  await writeAdminInvites(next);

  if (isSupabaseConfigured() && !session.isDemo) {
    const admin = createAdminClient();
    await admin.from("invite_codes").update({ is_active: isActive }).eq("id", id);
  }

  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: isActive ? "invite.enabled" : "invite.disabled",
    entity_type: "invite_code",
    entity_id: id,
    metadata: { is_active: isActive },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true };
}

export async function adminUpdateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:role-update",
    limit: 20,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const users = await readAdminUsers();
  const next = users.map((user) =>
    user.id === userId
      ? { ...user, role, updated_at: new Date().toISOString() }
      : user
  );
  await writeAdminUsers(next);

  if (isSupabaseConfigured() && !session.isDemo) {
    const admin = createAdminClient();
    await admin.from("profiles").update({ role }).eq("id", userId);
  }

  await appendActivityLog({
    user_id: userId,
    actor_id: session.userId,
    action: "user.role_updated",
    entity_type: "profile",
    entity_id: userId,
    metadata: { role },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true };
}

export async function adminToggleUserStatusAction(
  userId: string,
  status: "active" | "disabled"
): Promise<ActionResult> {
  const session = await requireAdmin();
  const users = await readAdminUsers();
  const next = users.map((user) =>
    user.id === userId
      ? { ...user, status, updated_at: new Date().toISOString() }
      : user
  );
  await writeAdminUsers(next);

  await appendActivityLog({
    user_id: userId,
    actor_id: session.userId,
    action: status === "active" ? "user.enabled" : "user.disabled",
    entity_type: "profile",
    entity_id: userId,
    metadata: { status },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true };
}

export async function adminUpdateCategoryAction(input: {
  id: string;
  name: string;
  color: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  const categories = await readAdminCategories();
  const next = categories.map((category) =>
    category.id === input.id
      ? { ...category, name: input.name, color: input.color }
      : category
  );
  await writeAdminCategories(next);

  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: "category.updated",
    entity_type: "category",
    entity_id: input.id,
    metadata: { name: input.name, color: input.color },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true };
}

export async function adminCreateCategoryAction(input: {
  name: string;
  slug: string;
  color: string;
}): Promise<ActionResult<Category>> {
  const session = await requireAdmin();
  const categories = await readAdminCategories();
  if (categories.some((c) => c.slug === input.slug)) {
    return { success: false, error: "Category slug already exists" };
  }

  const created: Category = {
    id: crypto.randomUUID(),
    slug: input.slug as Category["slug"],
    name: input.name,
    icon: "MoreHorizontal",
    color: input.color,
    sort_order: categories.length + 1,
    created_at: new Date().toISOString(),
  };

  await writeAdminCategories([...categories, created]);
  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: "category.created",
    entity_type: "category",
    entity_id: created.id,
    metadata: { name: created.name },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true, data: created };
}

export async function adminApprovePaymentAction(
  paymentId: string,
  decision: "approved" | "rejected",
  rejectionReason?: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const { reviewPaymentAction } = await import("@/features/payments/actions");
  const result = await reviewPaymentAction({
    paymentId,
    decision,
    rejectionReason,
  });

  if (!result.success) return result;

  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: decision === "approved" ? "payment.approved" : "payment.rejected",
    entity_type: "payment",
    entity_id: paymentId,
    metadata: { decision, rejectionReason },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true };
}
