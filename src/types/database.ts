export type UserRole = "user" | "admin";

export type AccountStatus = "pending" | "active" | "disabled";

export type SubscriptionStatus = "active" | "paused" | "cancelled";

export type SubscriptionPlanStatus = "active" | "archived";

export type AdminExpenseStatus = "active" | "archived";

export type BillingFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "yearly"
  | "custom";

export type BillStatus =
  | "upcoming"
  | "pending"
  | "overdue"
  | "pending_verification"
  | "paid"
  | "failed";

export type PaymentStatus =
  | "pending"
  | "pending_verification"
  | "approved"
  | "rejected"
  | "failed";

export type NotificationType =
  | "reminder_5d"
  | "reminder_3d"
  | "reminder_1d"
  | "due_today"
  | "overdue"
  | "payment_received"
  | "payment_approved"
  | "payment_rejected"
  | "subscription_renewed"
  | "system";

export type PlanTier =
  | "starter"
  | "personal"
  | "family"
  | "business"
  | "enterprise";

export type CategorySlug =
  | "streaming"
  | "internet"
  | "insurance"
  | "utilities"
  | "software"
  | "gaming"
  | "education"
  | "cloud"
  | "business"
  | "health"
  | "gym"
  | "loans"
  | "savings"
  | "others";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  /** Admin-assigned alias shown on the user profile */
  code_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  account_status: AccountStatus;
  plan_id: string | null;
  timezone: string;
  notification_email: boolean;
  notification_in_app: boolean;
  created_at: string;
  updated_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  created_by: string | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  slug: PlanTier;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  max_subscriptions: number | null;
  max_members: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  category_id: string | null;
  name: string;
  logo_url: string | null;
  amount: number;
  currency: string;
  billing_frequency: BillingFrequency;
  custom_interval_days: number | null;
  start_date: string;
  renewal_date: string;
  next_billing_date: string;
  auto_renewal: boolean;
  reminder_days: number[];
  status: SubscriptionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  category_id: string | null;
  logo_url: string | null;
  amount: number;
  currency: string;
  billing_frequency: BillingFrequency;
  custom_interval_days: number | null;
  max_capacity: number;
  status: SubscriptionPlanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Plan row with seat occupancy for admin UI */
export type SubscriptionPlanWithSeats = SubscriptionPlan & {
  seats_used: number;
};

export interface BillingCycle {
  id: string;
  subscription_id: string;
  user_id: string;
  amount: number;
  currency: string;
  due_date: string;
  status: BillStatus;
  paid_at: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  billing_cycle_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference_number: string | null;
  merchant: string | null;
  paid_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentReceipt {
  id: string;
  payment_id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  ocr_provider: string | null;
  ocr_raw: Record<string, unknown> | null;
  extracted_amount: number | null;
  extracted_reference: string | null;
  extracted_date: string | null;
  extracted_merchant: string | null;
  confidence: number | null;
  amount_match: boolean | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  channel: string;
  account_name: string;
  account_number: string;
  instructions: string | null;
  qr_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Platform / ops expense managed by admins */
export interface AdminExpense {
  id: string;
  name: string;
  category_id: string | null;
  amount: number;
  currency: string;
  is_recurring: boolean;
  billing_frequency: BillingFrequency | null;
  custom_interval_days: number | null;
  expense_date: string;
  next_recurrence_date: string | null;
  status: AdminExpenseStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface EmailLog {
  id: string;
  user_id: string | null;
  to_email: string;
  subject: string;
  template: string;
  status: "queued" | "sent" | "failed";
  provider_id: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      invite_codes: {
        Row: InviteCode;
        Insert: Partial<InviteCode> & Pick<InviteCode, "code">;
        Update: Partial<InviteCode>;
        Relationships: [];
      };
      plans: {
        Row: Plan;
        Insert: Partial<Plan> &
          Pick<Plan, "slug" | "name" | "price_monthly" | "price_yearly">;
        Update: Partial<Plan>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, "slug" | "name">;
        Update: Partial<Category>;
        Relationships: [];
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: Partial<SubscriptionPlan> &
          Pick<
            SubscriptionPlan,
            "name" | "amount" | "billing_frequency" | "max_capacity"
          >;
        Update: Partial<SubscriptionPlan>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription> &
          Pick<
            Subscription,
            | "user_id"
            | "name"
            | "amount"
            | "billing_frequency"
            | "start_date"
            | "renewal_date"
            | "next_billing_date"
          >;
        Update: Partial<Subscription>;
        Relationships: [];
      };
      billing_cycles: {
        Row: BillingCycle;
        Insert: Partial<BillingCycle> &
          Pick<
            BillingCycle,
            | "subscription_id"
            | "user_id"
            | "amount"
            | "due_date"
            | "period_start"
            | "period_end"
          >;
        Update: Partial<BillingCycle>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> &
          Pick<Payment, "billing_cycle_id" | "user_id" | "amount">;
        Update: Partial<Payment>;
        Relationships: [];
      };
      payment_receipts: {
        Row: PaymentReceipt;
        Insert: Partial<PaymentReceipt> &
          Pick<
            PaymentReceipt,
            | "payment_id"
            | "user_id"
            | "storage_path"
            | "file_name"
            | "mime_type"
            | "file_size"
          >;
        Update: Partial<PaymentReceipt>;
        Relationships: [];
      };
      payment_methods: {
        Row: PaymentMethod;
        Insert: Partial<PaymentMethod> &
          Pick<PaymentMethod, "channel" | "account_name" | "account_number">;
        Update: Partial<PaymentMethod>;
        Relationships: [];
      };
      admin_expenses: {
        Row: AdminExpense;
        Insert: Partial<AdminExpense> &
          Pick<AdminExpense, "name" | "amount" | "expense_date">;
        Update: Partial<AdminExpense>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> &
          Pick<Notification, "user_id" | "type" | "title" | "body">;
        Update: Partial<Notification>;
        Relationships: [];
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Partial<ActivityLog> & Pick<ActivityLog, "action">;
        Update: Partial<ActivityLog>;
        Relationships: [];
      };
      email_logs: {
        Row: EmailLog;
        Insert: Partial<EmailLog> &
          Pick<EmailLog, "to_email" | "subject" | "template" | "status">;
        Update: Partial<EmailLog>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      validate_and_consume_invite: {
        Args: { invite_code: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      subscription_status: SubscriptionStatus;
      subscription_plan_status: SubscriptionPlanStatus;
      admin_expense_status: AdminExpenseStatus;
      billing_frequency: BillingFrequency;
      bill_status: BillStatus;
      payment_status: PaymentStatus;
      notification_type: NotificationType;
      plan_tier: PlanTier;
      email_status: "queued" | "sent" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
}
