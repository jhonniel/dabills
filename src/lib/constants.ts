import type { CategorySlug, PlanTier } from "@/types";

export const APP_NAME = "DaBills";
export const APP_TAGLINE = "All Your Subscriptions. One Smart Dashboard.";

export const CATEGORIES: Array<{
  slug: CategorySlug;
  name: string;
  icon: string;
  color: string;
}> = [
  { slug: "streaming", name: "Streaming", icon: "Tv", color: "#EF4444" },
  { slug: "internet", name: "Internet", icon: "Wifi", color: "#3B82F6" },
  { slug: "insurance", name: "Insurance", icon: "Shield", color: "#10B981" },
  { slug: "utilities", name: "Utilities", icon: "Zap", color: "#F59E0B" },
  { slug: "software", name: "Software", icon: "Code2", color: "#06B6D4" },
  { slug: "gaming", name: "Gaming", icon: "Gamepad2", color: "#8B5CF6" },
  { slug: "education", name: "Education", icon: "GraduationCap", color: "#EC4899" },
  { slug: "cloud", name: "Cloud", icon: "Cloud", color: "#0EA5E9" },
  { slug: "business", name: "Business", icon: "Briefcase", color: "#64748B" },
  { slug: "health", name: "Health", icon: "HeartPulse", color: "#F43F5E" },
  { slug: "gym", name: "Gym", icon: "Dumbbell", color: "#22C55E" },
  { slug: "loans", name: "Loans", icon: "Landmark", color: "#A855F7" },
  { slug: "savings", name: "Savings", icon: "PiggyBank", color: "#14B8A6" },
  { slug: "others", name: "Others", icon: "MoreHorizontal", color: "#94A3B8" },
];

export const SHOWCASE_SUBSCRIPTIONS = [
  { name: "Netflix", price: 15.49, category: "Streaming", gradient: "from-red-600/40 to-black" },
  { name: "Spotify", price: 10.99, category: "Streaming", gradient: "from-emerald-500/40 to-black" },
  { name: "Disney+", price: 13.99, category: "Streaming", gradient: "from-blue-600/40 to-indigo-950" },
  { name: "YouTube Premium", price: 13.99, category: "Streaming", gradient: "from-rose-600/40 to-black" },
  { name: "Google One", price: 9.99, category: "Cloud", gradient: "from-sky-500/40 to-blue-950" },
  { name: "Microsoft 365", price: 9.99, category: "Software", gradient: "from-cyan-500/40 to-slate-950" },
  { name: "iCloud+", price: 2.99, category: "Cloud", gradient: "from-slate-400/40 to-slate-950" },
  { name: "Adobe Creative Cloud", price: 59.99, category: "Software", gradient: "from-red-500/40 to-rose-950" },
  { name: "Canva Pro", price: 14.99, category: "Software", gradient: "from-violet-500/40 to-fuchsia-950" },
  { name: "Prime Video", price: 8.99, category: "Streaming", gradient: "from-sky-600/40 to-slate-950" },
  { name: "Crunchyroll", price: 11.99, category: "Streaming", gradient: "from-orange-500/40 to-amber-950" },
  { name: "Steam", price: 0, category: "Gaming", gradient: "from-indigo-500/40 to-slate-950" },
  { name: "Epic Games", price: 0, category: "Gaming", gradient: "from-zinc-400/40 to-zinc-950" },
  { name: "PLDT Home", price: 49.99, category: "Internet", gradient: "from-blue-500/40 to-blue-950" },
  { name: "Globe Fiber", price: 39.99, category: "Internet", gradient: "from-blue-400/40 to-indigo-950" },
  { name: "Converge", price: 34.99, category: "Internet", gradient: "from-amber-500/40 to-orange-950" },
  { name: "Starlink", price: 120, category: "Internet", gradient: "from-slate-300/30 to-black" },
  { name: "Sky Cable", price: 29.99, category: "Internet", gradient: "from-yellow-500/40 to-zinc-950" },
  { name: "ChatGPT Plus", price: 20, category: "Software", gradient: "from-teal-500/40 to-emerald-950" },
  { name: "Claude Pro", price: 20, category: "Software", gradient: "from-orange-400/40 to-stone-950" },
  { name: "GitHub Copilot", price: 10, category: "Software", gradient: "from-zinc-300/30 to-zinc-950" },
  { name: "Cursor", price: 20, category: "Software", gradient: "from-cyan-400/40 to-slate-950" },
  { name: "Notion", price: 10, category: "Software", gradient: "from-zinc-200/20 to-zinc-950" },
  { name: "Dropbox", price: 11.99, category: "Cloud", gradient: "from-blue-500/40 to-blue-950" },
  { name: "OneDrive", price: 6.99, category: "Cloud", gradient: "from-sky-400/40 to-blue-950" },
] as const;

export const PRICING_PLANS: Array<{
  tier: PlanTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
}> = [
  {
    tier: "starter",
    name: "Starter",
    description: "Essential tracking for personal subscriptions.",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Up to 10 subscriptions",
      "Upcoming bill reminders",
      "Basic dashboard",
      "Email reminders",
    ],
    cta: "Get started",
  },
  {
    tier: "personal",
    name: "Personal",
    description: "Full visibility for individuals who want control.",
    priceMonthly: 9,
    priceYearly: 90,
    features: [
      "Unlimited subscriptions",
      "OCR receipt validation",
      "Payment history",
      "Analytics charts",
      "Priority reminders",
    ],
    highlighted: true,
    cta: "Start Personal",
  },
  {
    tier: "family",
    name: "Family",
    description: "Shared billing oversight for households.",
    priceMonthly: 19,
    priceYearly: 190,
    features: [
      "Everything in Personal",
      "Up to 5 members",
      "Shared categories",
      "Household analytics",
    ],
    cta: "Start Family",
  },
  {
    tier: "business",
    name: "Business",
    description: "SaaS spend control for growing teams.",
    priceMonthly: 49,
    priceYearly: 490,
    features: [
      "Everything in Family",
      "Up to 25 members",
      "Admin approvals",
      "Audit logs",
      "Export reports",
    ],
    cta: "Start Business",
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    description: "Custom controls, security, and scale.",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Unlimited members",
      "SSO-ready architecture",
      "Custom SLAs",
      "Dedicated support",
      "Advanced security",
    ],
    cta: "Contact sales",
  },
];

export const FEATURES = [
  {
    title: "Recurring Bills",
    description:
      "Automatically generate upcoming charges across monthly, quarterly, yearly, and custom cycles.",
    icon: "RefreshCw",
  },
  {
    title: "OCR Receipt Validation",
    description:
      "Upload receipts and extract amount, merchant, date, and reference with confidence scoring.",
    icon: "ScanText",
  },
  {
    title: "Email Reminders",
    description:
      "Get notified 5 days, 3 days, and 1 day before due dates — plus due today and overdue alerts.",
    icon: "Mail",
  },
  {
    title: "Payment History",
    description:
      "A clean timeline of every payment, receipt, reference number, and approval status.",
    icon: "History",
  },
  {
    title: "Smart Dashboard",
    description:
      "See monthly cost, yearly burn, upcoming bills, and activity in one premium overview.",
    icon: "LayoutDashboard",
  },
  {
    title: "Analytics",
    description:
      "Category breakdowns, recurring timelines, and expense trends that actually inform decisions.",
    icon: "BarChart3",
  },
  {
    title: "Invite-only Access",
    description:
      "Secure registration with expiring, limited-use invite codes controlled by admins.",
    icon: "KeyRound",
  },
] as const;

export const LANDING_STATS = [
  { label: "Active subscriptions", value: 12847, suffix: "+" },
  { label: "Bills paid", value: 92431, suffix: "+" },
  { label: "Monthly savings", value: 2.4, prefix: "$", suffix: "M" },
  { label: "Due this week", value: 3182, suffix: "" },
] as const;
