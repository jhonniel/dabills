"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/guard";
import {
  appendActivityLog,
  createDemoAdminUser,
  readAdminCategories,
  readAdminInvites,
  readAdminUsers,
  setDemoUserAccountStatus,
  setDemoUserCodeName,
  setDemoUserEmail,
  writeAdminCategories,
  writeAdminInvites,
  writeAdminUsers,
} from "@/lib/admin/demo-store";
import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { appendDemoEmailLog } from "@/lib/notifications/demo-store";
import { activationEmailHtml } from "@/emails/templates/activation";
import { sendEmail } from "@/services/email/client";
import { adminCreateUserSchema, adminSendActivationSchema } from "@/validators/admin-user";
import {
  isPlaceholderEmail,
  normalizeClaimEmail,
  pendingAuthEmail,
} from "@/lib/admin/pending-email";
import {
  readDemoPaymentMethods,
  writeDemoPaymentMethods,
} from "@/lib/payments/payment-methods-store";
import { storePaymentQr } from "@/lib/payments/storage";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextBillingDate } from "@/lib/billing/expenses";
import { generateBillingCyclesForSubscription } from "@/lib/billing/engine";
import { createDemoSubscription, readDemoSubscriptions } from "@/lib/billing/demo-store";
import {
  archiveDemoSubscriptionPlan,
  createDemoSubscriptionPlan,
  deleteDemoSubscriptionPlan,
  readDemoSubscriptionPlans,
  updateDemoSubscriptionPlan,
} from "@/lib/subscriptions/plans-store";
import {
  archiveDemoAdminExpense,
  clearDemoExpenseCookies,
  createDemoAdminExpense,
  isExpenseUuid,
  resolveNextRecurrenceDate,
  updateDemoAdminExpense,
} from "@/lib/expenses/expenses-store";
import type {
  AccountStatus,
  AdminExpense,
  Category,
  InviteCode,
  PaymentMethod,
  Subscription,
  SubscriptionPlan,
  UserRole,
} from "@/types";
import { inviteCodeSchema } from "@/validators/invite";
import { paymentMethodSchema } from "@/validators/payment-method";
import {
  subscriptionPlanSchema,
  type SubscriptionPlanInput,
} from "@/validators/subscription-plan";
import {
  subscriptionSchema,
  type SubscriptionInput,
} from "@/validators/subscription";
import {
  adminExpenseSchema,
  type AdminExpenseInput,
} from "@/validators/expense";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/invites");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/payment-setup");
  revalidatePath("/admin/subscriptions/assign");
  revalidatePath("/admin/subscriptions/plans");
  revalidatePath("/admin/expenses");
  revalidatePath("/");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/logs");
  revalidatePath("/admin/emails");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/subscriptions");
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

export async function adminUpdateUserCodeNameAction(
  userId: string,
  codeName: string | null
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:user-code-name",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const normalized =
    typeof codeName === "string" && codeName.trim()
      ? codeName.trim().slice(0, 64)
      : null;

  if (!isSupabaseConfigured() || session.isDemo) {
    try {
      const updated = await setDemoUserCodeName(userId, normalized);
      if (!updated) return { success: false, error: "User not found" };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Could not save code name",
      };
    }
  } else {
    const admin = createAdminClient();
    if (normalized) {
      const { data: clash } = await admin
        .from("profiles")
        .select("id")
        .ilike("code_name", normalized)
        .neq("id", userId)
        .maybeSingle();
      if (clash) {
        return {
          success: false,
          error: "That code name is already linked to another user",
        };
      }
    }

    const { error } = await admin
      .from("profiles")
      .update({ code_name: normalized })
      .eq("id", userId);
    if (error) {
      if (error.message.toLowerCase().includes("unique")) {
        return {
          success: false,
          error: "That code name is already linked to another user",
        };
      }
      return { success: false, error: error.message };
    }
  }

  await appendActivityLog({
    user_id: userId,
    actor_id: session.userId,
    action: "user.code_name_updated",
    entity_type: "profile",
    entity_id: userId,
    metadata: { code_name: normalized },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true };
}

export async function adminToggleUserStatusAction(
  userId: string,
  status: AccountStatus
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:user-status",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();

  if (status === "pending") {
    return { success: false, error: "Use Send activation for pending accounts" };
  }

  if (!isSupabaseConfigured() || session.isDemo) {
    const updated = await setDemoUserAccountStatus(userId, status);
    if (!updated) return { success: false, error: "User not found" };
  } else {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ account_status: status })
      .eq("id", userId);
    if (error) return { success: false, error: error.message };

    // Ban / unban in Auth so login is blocked when disabled
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: status === "disabled" ? "876000h" : "none",
    });
  }

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

async function deliverActivationLink(input: {
  userId: string;
  email: string;
  fullName: string | null;
  activationUrl: string;
  actorId: string;
}) {
  const html = activationEmailHtml({
    activationUrl: input.activationUrl,
    recipientName: input.fullName ?? undefined,
  });
  const subject = "Claim your DaBills account";

  if (process.env.RESEND_API_KEY) {
    const result = await sendEmail({
      to: input.email,
      subject,
      html,
      template: "activation",
      userId: input.userId,
      metadata: { activationUrl: input.activationUrl },
    });
    await appendDemoEmailLog({
      user_id: input.userId,
      to_email: input.email,
      subject,
      template: "activation",
      status: result.log.status ?? "sent",
      provider_id: result.log.provider_id ?? null,
      error: result.log.error ?? null,
      metadata: { activationUrl: input.activationUrl },
    });
    if (result.log.status === "failed") {
      return {
        emailed: false as const,
        error: result.log.error ?? "Failed to send activation email",
      };
    }
    return { emailed: true as const };
  }

  await appendDemoEmailLog({
    user_id: input.userId,
    to_email: input.email,
    subject,
    template: "activation",
    status: "sent",
    provider_id: null,
    error: null,
    metadata: { activationUrl: input.activationUrl, demo: true },
  });

  return { emailed: false as const, demoLogged: true as const };
}

async function buildSupabaseActivationUrl(email: string) {
  const admin = createAdminClient();
  const redirectTo = `${getAppUrl()}/auth/callback?next=${encodeURIComponent("/activate")}`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });
  if (error || !data?.properties?.action_link) {
    throw new Error(error?.message ?? "Failed to generate activation link");
  }
  return data.properties.action_link as string;
}

export async function adminCreateUserAction(input: {
  email?: string;
  fullName: string;
  sendActivation?: boolean;
}): Promise<
  ActionResult<{ id: string; activationUrl?: string; emailed?: boolean }>
> {
  const guard = await enforceMutationGuard({
    action: "admin:user-create",
    limit: 20,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = adminCreateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid user",
    };
  }

  const email = normalizeClaimEmail(parsed.data.email);
  const fullName = parsed.data.fullName.trim();
  const sendActivation = Boolean(parsed.data.sendActivation);

  if (sendActivation && !email) {
    return {
      success: false,
      error: "Email is required when sending a claim link",
    };
  }

  if (!isSupabaseConfigured() || session.isDemo) {
    try {
      const created = await createDemoAdminUser({ email, fullName });
      let activationUrl: string | undefined;
      let emailed = false;

      if (sendActivation && email && created.activation_token) {
        activationUrl = `${getAppUrl()}/activate?token=${created.activation_token}`;
        const delivery = await deliverActivationLink({
          userId: created.id,
          email,
          fullName: created.full_name,
          activationUrl,
          actorId: session.userId,
        });
        if ("error" in delivery && delivery.error) {
          return { success: false, error: delivery.error };
        }
        emailed = delivery.emailed;
      }

      await appendActivityLog({
        user_id: created.id,
        actor_id: session.userId,
        action: "user.created",
        entity_type: "profile",
        entity_id: created.id,
        metadata: { email, sendActivation, emailed },
        ip_address: null,
        user_agent: "admin",
      });

      revalidateAdmin();
      return {
        success: true,
        data: { id: created.id, activationUrl, emailed },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user",
      };
    }
  }

  const admin = createAdminClient();
  const tempPassword = `${crypto.randomUUID()}Aa1!`;
  const authEmail = email ?? pendingAuthEmail();

  const { data: createdAuth, error: createError } =
    await admin.auth.admin.createUser({
      email: authEmail,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
        account_status: "pending",
        provisioned_by: "admin",
      },
    });

  if (createError || !createdAuth.user) {
    return {
      success: false,
      error: createError?.message ?? "Failed to create auth user",
    };
  }

  const userId = createdAuth.user.id;

  await admin
    .from("profiles")
    .update({
      full_name: fullName,
      email,
      account_status: "pending",
    })
    .eq("id", userId);

  let activationUrl: string | undefined;
  let emailed = false;

  if (sendActivation && email) {
    try {
      activationUrl = await buildSupabaseActivationUrl(email);
      const delivery = await deliverActivationLink({
        userId,
        email,
        fullName,
        activationUrl,
        actorId: session.userId,
      });
      if ("error" in delivery && delivery.error) {
        return { success: false, error: delivery.error };
      }
      emailed = delivery.emailed;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "User created but claim link failed",
      };
    }
  }

  await appendActivityLog({
    user_id: userId,
    actor_id: session.userId,
    action: "user.created",
    entity_type: "profile",
    entity_id: userId,
    metadata: { email, sendActivation, emailed },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return {
    success: true,
    data: { id: userId, activationUrl, emailed },
  };
}

export async function adminSendActivationLinkAction(input: {
  userId: string;
  /** When false, only generate/return the direct claim link (no email). Default true. */
  sendEmail?: boolean;
  /** Required when the profile does not already have a real email. */
  email?: string;
}): Promise<ActionResult<{ activationUrl: string; emailed: boolean }>> {
  const guard = await enforceMutationGuard({
    action: "admin:user-activation",
    limit: 30,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = adminSendActivationSchema.safeParse({
    userId: input.userId,
    sendEmail: input.sendEmail !== false,
    email: input.email ?? "",
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid activation request",
    };
  }

  const userId = parsed.data.userId;
  const shouldEmail = parsed.data.sendEmail !== false;
  const providedEmail = normalizeClaimEmail(parsed.data.email);

  if (!isSupabaseConfigured() || session.isDemo) {
    const users = await readAdminUsers();
    const user = users.find((item) => item.id === userId);
    if (!user) return { success: false, error: "User not found" };
    if (user.account_status === "disabled") {
      return {
        success: false,
        error: "Enable the user before sharing a claim link",
      };
    }

    let claimEmail = normalizeClaimEmail(user.email);
    if (isPlaceholderEmail(claimEmail)) claimEmail = null;
    if (providedEmail) {
      try {
        const updated = await setDemoUserEmail(userId, providedEmail);
        if (!updated) return { success: false, error: "User not found" };
        claimEmail = providedEmail;
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Could not save email",
        };
      }
    }

    if (!claimEmail) {
      return {
        success: false,
        error: "Email is required to send or copy a claim link",
      };
    }

    const token = user.activation_token ?? crypto.randomUUID();
    if ((user.account_status ?? user.status) !== "active") {
      await setDemoUserAccountStatus(userId, "pending", {
        activation_token: token,
      });
    } else if (!user.activation_token) {
      await setDemoUserAccountStatus(userId, "active", {
        activation_token: token,
      });
    }
    const activationUrl = `${getAppUrl()}/activate?token=${token}`;

    let emailed = false;
    if (shouldEmail) {
      const delivery = await deliverActivationLink({
        userId,
        email: claimEmail,
        fullName: user.full_name,
        activationUrl,
        actorId: session.userId,
      });
      if ("error" in delivery && delivery.error) {
        return { success: false, error: delivery.error };
      }
      emailed = delivery.emailed;
    }

    await appendActivityLog({
      user_id: userId,
      actor_id: session.userId,
      action: shouldEmail ? "user.claim_sent" : "user.claim_link",
      entity_type: "profile",
      entity_id: userId,
      metadata: { emailed, sendEmail: shouldEmail, email: claimEmail },
      ip_address: null,
      user_agent: "admin",
    });

    revalidateAdmin();
    return {
      success: true,
      data: { activationUrl, emailed },
    };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, full_name, account_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return { success: false, error: profileError?.message ?? "User not found" };
  }

  if (profile.account_status === "disabled") {
    return {
      success: false,
      error: "Enable the user before sharing a claim link",
    };
  }

  let claimEmail = normalizeClaimEmail(profile.email);
  if (isPlaceholderEmail(claimEmail)) claimEmail = null;

  if (providedEmail) {
    const { data: clash } = await admin
      .from("profiles")
      .select("id")
      .eq("email", providedEmail)
      .neq("id", userId)
      .maybeSingle();
    if (clash) {
      return {
        success: false,
        error: "That email is already linked to another user",
      };
    }

    const { error: authEmailError } = await admin.auth.admin.updateUserById(
      userId,
      {
        email: providedEmail,
        email_confirm: false,
      }
    );
    if (authEmailError) {
      return { success: false, error: authEmailError.message };
    }

    const { error: profileEmailError } = await admin
      .from("profiles")
      .update({ email: providedEmail })
      .eq("id", userId);
    if (profileEmailError) {
      return { success: false, error: profileEmailError.message };
    }
    claimEmail = providedEmail;
  }

  if (!claimEmail) {
    return {
      success: false,
      error: "Email is required to send or copy a claim link",
    };
  }

  try {
    const activationUrl = await buildSupabaseActivationUrl(claimEmail);
    if (profile.account_status !== "active") {
      await admin
        .from("profiles")
        .update({ account_status: "pending" })
        .eq("id", userId);
    }

    let emailed = false;
    if (shouldEmail) {
      const delivery = await deliverActivationLink({
        userId,
        email: claimEmail,
        fullName: profile.full_name,
        activationUrl,
        actorId: session.userId,
      });
      if ("error" in delivery && delivery.error) {
        return { success: false, error: delivery.error };
      }
      emailed = delivery.emailed;
    }

    await appendActivityLog({
      user_id: userId,
      actor_id: session.userId,
      action: shouldEmail ? "user.claim_sent" : "user.claim_link",
      entity_type: "profile",
      entity_id: userId,
      metadata: { emailed, sendEmail: shouldEmail, email: claimEmail },
      ip_address: null,
      user_agent: "admin",
    });

    revalidateAdmin();
    return {
      success: true,
      data: { activationUrl, emailed },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate claim link",
    };
  }
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

async function resolvePaymentQrUrl(
  methodId: string,
  qrImage: File | null | undefined
): Promise<{ url?: string; error?: string }> {
  if (!qrImage || qrImage.size === 0) return {};
  if (!qrImage.type.startsWith("image/")) {
    return { error: "QR must be an image file" };
  }
  if (qrImage.size > 2 * 1024 * 1024) {
    return { error: "QR image must be under 2MB" };
  }
  const bytes = Buffer.from(await qrImage.arrayBuffer());
  const url = await storePaymentQr({
    methodId,
    fileName: qrImage.name || "qr.png",
    mimeType: qrImage.type,
    bytes,
  });
  return { url };
}

export async function adminCreatePaymentMethodAction(input: {
  channel: string;
  accountName: string;
  accountNumber: string;
  instructions?: string | null;
  qrImage?: File | null;
}): Promise<ActionResult<PaymentMethod>> {
  const guard = await enforceMutationGuard({
    action: "admin:payment-method-create",
    limit: 20,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = paymentMethodSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid payment method",
    };
  }

  const methodId = crypto.randomUUID();
  const qr = await resolvePaymentQrUrl(methodId, input.qrImage);
  if (qr.error) return { success: false, error: qr.error };

  const now = new Date().toISOString();

  if (!isSupabaseConfigured() || session.isDemo) {
    const items = await readDemoPaymentMethods();
    const created: PaymentMethod = {
      id: methodId,
      channel: parsed.data.channel,
      account_name: parsed.data.accountName,
      account_number: parsed.data.accountNumber,
      instructions: parsed.data.instructions ?? null,
      qr_image_url: qr.url ?? null,
      is_active: true,
      sort_order: items.length + 1,
      created_by: session.userId,
      created_at: now,
      updated_at: now,
    };
    await writeDemoPaymentMethods([...items, created]);
    await appendActivityLog({
      user_id: null,
      actor_id: session.userId,
      action: "payment_method.created",
      entity_type: "payment_method",
      entity_id: created.id,
      metadata: { channel: created.channel },
      ip_address: null,
      user_agent: "admin",
    });
    revalidateAdmin();
    return { success: true, data: created };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payment_methods")
    .insert({
      id: methodId,
      channel: parsed.data.channel,
      account_name: parsed.data.accountName,
      account_number: parsed.data.accountNumber,
      instructions: parsed.data.instructions ?? null,
      qr_image_url: qr.url ?? null,
      is_active: true,
      created_by: session.userId,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Failed to create method",
    };
  }

  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: "payment_method.created",
    entity_type: "payment_method",
    entity_id: (data as PaymentMethod).id,
    metadata: { channel: (data as PaymentMethod).channel },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true, data: data as PaymentMethod };
}

export async function adminUpdatePaymentMethodAction(input: {
  id: string;
  channel?: string;
  accountName?: string;
  accountNumber?: string;
  instructions?: string | null;
  isActive?: boolean;
  qrImage?: File | null;
  clearQr?: boolean;
}): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:payment-method-update",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const now = new Date().toISOString();

  let qrImageUrl: string | null | undefined;
  if (input.clearQr) {
    qrImageUrl = null;
  } else if (input.qrImage && input.qrImage.size > 0) {
    const qr = await resolvePaymentQrUrl(input.id, input.qrImage);
    if (qr.error) return { success: false, error: qr.error };
    qrImageUrl = qr.url ?? null;
  }

  if (!isSupabaseConfigured() || session.isDemo) {
    const items = await readDemoPaymentMethods();
    const next = items.map((item) =>
      item.id === input.id
        ? {
            ...item,
            channel: input.channel ?? item.channel,
            account_name: input.accountName ?? item.account_name,
            account_number: input.accountNumber ?? item.account_number,
            instructions:
              input.instructions === undefined
                ? item.instructions
                : input.instructions,
            qr_image_url:
              qrImageUrl === undefined ? item.qr_image_url : qrImageUrl,
            is_active:
              input.isActive === undefined ? item.is_active : input.isActive,
            updated_at: now,
          }
        : item
    );
    await writeDemoPaymentMethods(next);
    revalidateAdmin();
    return { success: true };
  }

  const patch: Record<string, unknown> = { updated_at: now };
  if (input.channel !== undefined) patch.channel = input.channel;
  if (input.accountName !== undefined) patch.account_name = input.accountName;
  if (input.accountNumber !== undefined) {
    patch.account_number = input.accountNumber;
  }
  if (input.instructions !== undefined) {
    patch.instructions = input.instructions;
  }
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (qrImageUrl !== undefined) patch.qr_image_url = qrImageUrl;

  const admin = createAdminClient();
  const { error } = await admin
    .from("payment_methods")
    .update(patch)
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };

  revalidateAdmin();
  return { success: true };
}

export async function adminDeletePaymentMethodAction(
  id: string
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:payment-method-delete",
    limit: 20,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();

  if (!isSupabaseConfigured() || session.isDemo) {
    const items = await readDemoPaymentMethods();
    await writeDemoPaymentMethods(items.filter((item) => item.id !== id));
    revalidateAdmin();
    return { success: true };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("payment_methods").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidateAdmin();
  return { success: true };
}

export async function adminCreateSubscriptionPlanAction(
  input: SubscriptionPlanInput
): Promise<ActionResult<{ id: string }>> {
  const guard = await enforceMutationGuard({
    action: "admin:subscription-plan-create",
    limit: 30,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = subscriptionPlanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid plan",
    };
  }

  if (!isSupabaseConfigured() || session.isDemo) {
    const created = await createDemoSubscriptionPlan(parsed.data);
    await appendActivityLog({
      user_id: null,
      actor_id: session.userId,
      action: "subscription_plan.created",
      entity_type: "subscription_plan",
      entity_id: created.id,
      metadata: {
        name: created.name,
        max_capacity: created.max_capacity,
      },
      ip_address: null,
      user_agent: "admin",
    });
    revalidateAdmin();
    return { success: true, data: { id: created.id } };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscription_plans")
    .insert({
      name: parsed.data.name,
      category_id: parsed.data.categoryId ?? null,
      logo_url: parsed.data.logoUrl || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency || "PHP",
      billing_frequency: parsed.data.billingFrequency,
      custom_interval_days: parsed.data.customIntervalDays ?? null,
      max_capacity: parsed.data.maxCapacity,
      status: parsed.data.status ?? "active",
      notes: parsed.data.notes ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Failed to create plan",
    };
  }

  const plan = data as SubscriptionPlan;
  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: "subscription_plan.created",
    entity_type: "subscription_plan",
    entity_id: plan.id,
    metadata: { name: plan.name, max_capacity: plan.max_capacity },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true, data: { id: plan.id } };
}

export async function adminUpdateSubscriptionPlanAction(input: {
  id: string;
  plan: SubscriptionPlanInput;
}): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:subscription-plan-update",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = subscriptionPlanSchema.safeParse(input.plan);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid plan",
    };
  }

  if (!isSupabaseConfigured() || session.isDemo) {
    const plans = await readDemoSubscriptionPlans();
    const current = plans.find((p) => p.id === input.id);
    const seatsUsed = (await readDemoSubscriptions()).filter(
      (s) =>
        s.plan_id === input.id &&
        (s.status === "active" || s.status === "paused")
    ).length;
    if (seatsUsed > parsed.data.maxCapacity) {
      return {
        success: false,
        error: `Capacity cannot be below seats in use (${seatsUsed})`,
      };
    }
    const updated = await updateDemoSubscriptionPlan(input.id, parsed.data);
    if (!updated) return { success: false, error: "Plan not found" };

    if (current && Number(current.amount) !== Number(parsed.data.amount)) {
      const { applyDemoPlanPriceForward } = await import(
        "@/lib/billing/demo-bills"
      );
      await applyDemoPlanPriceForward(
        input.id,
        parsed.data.amount,
        parsed.data.currency
      );
    }

    revalidateAdmin();
    return { success: true };
  }

  const admin = createAdminClient();
  const { data: existingPlan } = await admin
    .from("subscription_plans")
    .select("amount")
    .eq("id", input.id)
    .maybeSingle();

  const { count: seatsUsed, error: seatError } = await admin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", input.id)
    .neq("status", "cancelled");

  if (seatError) return { success: false, error: seatError.message };
  if ((seatsUsed ?? 0) > parsed.data.maxCapacity) {
    return {
      success: false,
      error: `Capacity cannot be below seats in use (${seatsUsed})`,
    };
  }

  const patch: Record<string, unknown> = {
    name: parsed.data.name,
    category_id: parsed.data.categoryId ?? null,
    amount: parsed.data.amount,
    currency: parsed.data.currency || "PHP",
    billing_frequency: parsed.data.billingFrequency,
    custom_interval_days: parsed.data.customIntervalDays ?? null,
    max_capacity: parsed.data.maxCapacity,
    status: parsed.data.status ?? "active",
    notes: parsed.data.notes ?? null,
  };
  if (parsed.data.logoUrl !== undefined) {
    patch.logo_url = parsed.data.logoUrl || null;
  }

  const { error } = await admin
    .from("subscription_plans")
    .update(patch)
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };

  const previousAmount = Number(
    (existingPlan as { amount?: number } | null)?.amount ?? NaN
  );
  if (
    Number.isFinite(previousAmount) &&
    previousAmount !== Number(parsed.data.amount)
  ) {
    const today = new Date().toISOString().slice(0, 10);

    // Seats get the new price for future billing
    await admin
      .from("subscriptions")
      .update({
        amount: parsed.data.amount,
        currency: parsed.data.currency || "PHP",
      })
      .eq("plan_id", input.id)
      .in("status", ["active", "paused"]);

    // Future upcoming bills only — past / due / paid stay unchanged
    const { data: seats } = await admin
      .from("subscriptions")
      .select("id")
      .eq("plan_id", input.id)
      .in("status", ["active", "paused"]);

    const seatIds = ((seats ?? []) as { id: string }[]).map((s) => s.id);
    if (seatIds.length > 0) {
      await admin
        .from("billing_cycles")
        .update({
          amount: parsed.data.amount,
          currency: parsed.data.currency || "PHP",
        })
        .in("subscription_id", seatIds)
        .eq("status", "upcoming")
        .gt("due_date", today);
    }
  }

  revalidateAdmin();
  return { success: true };
}

export async function adminArchiveSubscriptionPlanAction(
  id: string
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:subscription-plan-archive",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();

  if (!isSupabaseConfigured() || session.isDemo) {
    const archived = await archiveDemoSubscriptionPlan(id);
    if (!archived) return { success: false, error: "Plan not found" };
    revalidateAdmin();
    return { success: true };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("subscription_plans")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: "subscription_plan.archived",
    entity_type: "subscription_plan",
    entity_id: id,
    metadata: {},
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true };
}

export async function adminDeleteSubscriptionPlanAction(
  id: string
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:subscription-plan-delete",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();

  if (!isSupabaseConfigured() || session.isDemo) {
    const seatsUsed = (await readDemoSubscriptions()).filter(
      (s) =>
        s.plan_id === id &&
        (s.status === "active" || s.status === "paused")
    ).length;
    if (seatsUsed > 0) {
      return {
        success: false,
        error: `Cannot delete: ${seatsUsed} seat${seatsUsed === 1 ? "" : "s"} still assigned. Archive instead, or remove seats first.`,
      };
    }
    const deleted = await deleteDemoSubscriptionPlan(id);
    if (!deleted) return { success: false, error: "Plan not found" };
    revalidateAdmin();
    return { success: true };
  }

  const admin = createAdminClient();
  const { count: seatsUsed, error: seatError } = await admin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", id)
    .neq("status", "cancelled");

  if (seatError) return { success: false, error: seatError.message };
  if ((seatsUsed ?? 0) > 0) {
    return {
      success: false,
      error: `Cannot delete: ${seatsUsed} seat${seatsUsed === 1 ? "" : "s"} still assigned. Archive instead, or remove seats first.`,
    };
  }

  const { error } = await admin.from("subscription_plans").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  await appendActivityLog({
    user_id: null,
    actor_id: session.userId,
    action: "subscription_plan.deleted",
    entity_type: "subscription_plan",
    entity_id: id,
    metadata: {},
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true };
}

export async function adminAssignUserToPlanAction(input: {
  planId: string;
  userId: string;
  startDate: string;
  nextBillingDate: string;
}): Promise<ActionResult<{ id: string }>> {
  const guard = await enforceMutationGuard({
    action: "admin:assign-user-to-plan",
    limit: 30,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();

  if (!input.planId.trim()) {
    return { success: false, error: "Select a plan" };
  }
  if (!input.userId.trim()) {
    return { success: false, error: "Select a user" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    return { success: false, error: "Pick a valid start date" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.nextBillingDate)) {
    return { success: false, error: "Pick a valid next bill date" };
  }

  const startDate = input.startDate;
  const nextBillingDate = input.nextBillingDate;

  if (!isSupabaseConfigured() || session.isDemo) {
    const plans = await readDemoSubscriptionPlans();
    const plan = plans.find((p) => p.id === input.planId);
    if (!plan) return { success: false, error: "Plan not found" };
    if (plan.status !== "active") {
      return { success: false, error: "Plan is archived" };
    }

    const { readDemoSubscriptions } = await import("@/lib/billing/demo-store");
    const seats = (await readDemoSubscriptions()).filter(
      (s) =>
        s.plan_id === plan.id &&
        (s.status === "active" || s.status === "paused")
    );
    if (seats.length >= plan.max_capacity) {
      return {
        success: false,
        error: `Plan is full (${plan.max_capacity}/${plan.max_capacity} seats)`,
      };
    }
    if (seats.some((s) => s.user_id === input.userId)) {
      return { success: false, error: "User already has a seat on this plan" };
    }

    const created = await createDemoSubscription(
      {
        name: plan.name,
        categoryId: plan.category_id,
        logoUrl: plan.logo_url ?? "",
        amount: Number(plan.amount),
        currency: plan.currency,
        billingFrequency: plan.billing_frequency,
        customIntervalDays: plan.custom_interval_days,
        startDate,
        renewalDate: nextBillingDate,
        autoRenewal: true,
        reminderDays: [5, 3, 1],
        status: "active",
        notes: plan.notes,
      },
      input.userId,
      plan.id,
      { nextBillingDate }
    );

    await appendActivityLog({
      user_id: input.userId,
      actor_id: session.userId,
      action: "subscription.assigned",
      entity_type: "subscription",
      entity_id: created.id,
      metadata: {
        name: created.name,
        plan_id: plan.id,
        start_date: startDate,
        next_billing_date: nextBillingDate,
      },
      ip_address: null,
      user_agent: "admin",
    });
    revalidateAdmin();
    return { success: true, data: { id: created.id } };
  }

  const admin = createAdminClient();
  const { data: planRow, error: planError } = await admin
    .from("subscription_plans")
    .select("*")
    .eq("id", input.planId)
    .maybeSingle();

  if (planError || !planRow) {
    return { success: false, error: planError?.message ?? "Plan not found" };
  }

  const plan = planRow as SubscriptionPlan;
  if (plan.status !== "active") {
    return { success: false, error: "Plan is archived" };
  }

  const { count, error: countError } = await admin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", plan.id)
    .in("status", ["active", "paused"]);

  if (countError) {
    return { success: false, error: countError.message };
  }

  if ((count ?? 0) >= plan.max_capacity) {
    return {
      success: false,
      error: `Plan is full (${plan.max_capacity}/${plan.max_capacity} seats)`,
    };
  }

  const { data: existingSeat } = await admin
    .from("subscriptions")
    .select("id")
    .eq("plan_id", plan.id)
    .eq("user_id", input.userId)
    .in("status", ["active", "paused"])
    .maybeSingle();

  if (existingSeat) {
    return { success: false, error: "User already has a seat on this plan" };
  }

  const { data, error } = await admin
    .from("subscriptions")
    .insert({
      user_id: input.userId,
      plan_id: plan.id,
      category_id: plan.category_id,
      name: plan.name,
      logo_url: plan.logo_url,
      amount: plan.amount,
      currency: plan.currency || "PHP",
      billing_frequency: plan.billing_frequency,
      custom_interval_days: plan.custom_interval_days,
      start_date: startDate,
      renewal_date: nextBillingDate,
      next_billing_date: nextBillingDate,
      auto_renewal: true,
      reminder_days: [5, 3, 1],
      status: "active",
      notes: plan.notes,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Failed to assign seat",
    };
  }

  const subscription = data as Subscription;
  const { data: existingCycles } = await admin
    .from("billing_cycles")
    .select("*")
    .eq("user_id", input.userId);

  const drafts = generateBillingCyclesForSubscription(
    subscription,
    (existingCycles ?? []) as import("@/types").BillingCycle[],
    { horizonDays: 120, maxCycles: 4 }
  );

  if (drafts.length > 0) {
    await admin.from("billing_cycles").insert(drafts);
  }

  await appendActivityLog({
    user_id: input.userId,
    actor_id: session.userId,
    action: "subscription.assigned",
    entity_type: "subscription",
    entity_id: subscription.id,
    metadata: {
      name: subscription.name,
      plan_id: plan.id,
      start_date: startDate,
      next_billing_date: nextBillingDate,
    },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true, data: { id: subscription.id } };
}

/** @deprecated Prefer adminAssignUserToPlanAction — kept for any legacy callers */
export async function adminAssignSubscriptionAction(input: {
  userId: string;
  subscription: SubscriptionInput;
}): Promise<ActionResult<{ id: string }>> {
  const guard = await enforceMutationGuard({
    action: "admin:assign-subscription",
    limit: 30,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = subscriptionSchema.safeParse(input.subscription);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid subscription",
    };
  }

  if (!input.userId.trim()) {
    return { success: false, error: "Select a user" };
  }

  if (!isSupabaseConfigured() || session.isDemo) {
    const created = await createDemoSubscription(parsed.data, input.userId);
    await appendActivityLog({
      user_id: input.userId,
      actor_id: session.userId,
      action: "subscription.assigned",
      entity_type: "subscription",
      entity_id: created.id,
      metadata: { name: created.name },
      ip_address: null,
      user_agent: "admin",
    });
    revalidateAdmin();
    return { success: true, data: { id: created.id } };
  }

  const nextBilling = getNextBillingDate(
    parsed.data.renewalDate,
    parsed.data.billingFrequency,
    parsed.data.customIntervalDays
  );

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .insert({
      user_id: input.userId,
      category_id: parsed.data.categoryId ?? null,
      name: parsed.data.name,
      logo_url: parsed.data.logoUrl || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency || "PHP",
      billing_frequency: parsed.data.billingFrequency,
      custom_interval_days: parsed.data.customIntervalDays ?? null,
      start_date: parsed.data.startDate,
      renewal_date: parsed.data.renewalDate,
      next_billing_date: nextBilling,
      auto_renewal: parsed.data.autoRenewal,
      reminder_days: parsed.data.reminderDays,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Failed to assign subscription",
    };
  }

  const subscription = data as Subscription;
  const { data: existingCycles } = await admin
    .from("billing_cycles")
    .select("*")
    .eq("user_id", input.userId);

  const drafts = generateBillingCyclesForSubscription(
    subscription,
    (existingCycles ?? []) as import("@/types").BillingCycle[],
    { horizonDays: 120, maxCycles: 4 }
  );

  if (drafts.length > 0) {
    await admin.from("billing_cycles").insert(drafts);
  }

  await appendActivityLog({
    user_id: input.userId,
    actor_id: session.userId,
    action: "subscription.assigned",
    entity_type: "subscription",
    entity_id: subscription.id,
    metadata: { name: subscription.name },
    ip_address: null,
    user_agent: "admin",
  });

  revalidateAdmin();
  return { success: true, data: { id: subscription.id } };
}

function expenseRowFromInput(
  input: AdminExpenseInput,
  createdBy?: string | null
): Omit<AdminExpense, "id" | "created_at" | "updated_at"> & {
  created_by?: string | null;
} {
  return {
    name: input.name,
    category_id: input.categoryId ?? null,
    amount: input.amount,
    currency: input.currency || "PHP",
    is_recurring: input.isRecurring,
    billing_frequency: input.isRecurring ? input.billingFrequency ?? null : null,
    custom_interval_days: input.isRecurring
      ? input.customIntervalDays ?? null
      : null,
    expense_date: input.expenseDate,
    next_recurrence_date: resolveNextRecurrenceDate(input),
    status: input.status ?? "active",
    notes: input.notes ?? null,
    created_by: createdBy ?? null,
  };
}

function isMissingRelationError(message: string | undefined) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    lower.includes("could not find the table") ||
    lower.includes("does not exist")
  );
}

export async function adminCreateExpenseAction(
  input: AdminExpenseInput
): Promise<ActionResult<{ id: string }>> {
  const guard = await enforceMutationGuard({
    action: "admin:expense-create",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = adminExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid expense",
    };
  }

  if (!isSupabaseConfigured() || session.isDemo) {
    const created = await createDemoAdminExpense(parsed.data, session.userId);
    revalidateAdmin();
    return { success: true, data: { id: created.id } };
  }

  await clearDemoExpenseCookies();

  const admin = createAdminClient();
  const row = expenseRowFromInput(parsed.data, session.userId);
  const { data, error } = await admin
    .from("admin_expenses")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: isMissingRelationError(error?.message)
        ? "Expenses table is missing. Apply migration 008_admin_expenses.sql."
        : (error?.message ?? "Failed to create expense"),
    };
  }

  revalidateAdmin();
  return { success: true, data: { id: (data as { id: string }).id } };
}

export async function adminUpdateExpenseAction(input: {
  id: string;
  expense: AdminExpenseInput;
}): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:expense-update",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();
  const parsed = adminExpenseSchema.safeParse(input.expense);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid expense",
    };
  }

  if (!isSupabaseConfigured() || session.isDemo) {
    const updated = await updateDemoAdminExpense(input.id, parsed.data);
    if (!updated) return { success: false, error: "Expense not found" };
    revalidateAdmin();
    return { success: true };
  }

  if (!isExpenseUuid(input.id)) {
    await clearDemoExpenseCookies();
    return {
      success: false,
      error: "That expense is outdated. Refresh the page, then try again.",
    };
  }

  const admin = createAdminClient();
  const row = expenseRowFromInput(parsed.data);
  const { created_by: _createdBy, ...patch } = row;
  const { data, error } = await admin
    .from("admin_expenses")
    .update(patch)
    .eq("id", input.id)
    .select("id");

  if (error) {
    return {
      success: false,
      error: isMissingRelationError(error.message)
        ? "Expenses table is missing. Apply migration 008_admin_expenses.sql."
        : error.message,
    };
  }

  if (!data?.length) {
    return { success: false, error: "Expense not found" };
  }

  revalidateAdmin();
  return { success: true };
}

export async function adminArchiveExpenseAction(
  id: string
): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "admin:expense-archive",
    limit: 40,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const session = await requireAdmin();

  if (!isSupabaseConfigured() || session.isDemo) {
    const archived = await archiveDemoAdminExpense(id);
    if (!archived) return { success: false, error: "Expense not found" };
    revalidateAdmin();
    return { success: true };
  }

  if (!isExpenseUuid(id)) {
    await clearDemoExpenseCookies();
    return {
      success: false,
      error: "That expense is outdated. Refresh the page, then try again.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_expenses")
    .update({ status: "archived" })
    .eq("id", id)
    .select("id");

  if (error) {
    return {
      success: false,
      error: isMissingRelationError(error.message)
        ? "Expenses table is missing. Apply migration 008_admin_expenses.sql."
        : error.message,
    };
  }

  if (!data?.length) {
    return { success: false, error: "Expense not found" };
  }

  revalidateAdmin();
  return { success: true };
}
