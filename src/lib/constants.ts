import type { CategorySlug, PlanTier } from "@/types";

export const APP_NAME = "DaBills";
export const APP_TAGLINE = "All Your Subscriptions. One Smart Dashboard.";

/** Default billing currency — Philippine Peso */
export const DEFAULT_CURRENCY = "PHP";
export const DEFAULT_LOCALE = "en-PH";

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
  { name: "Netflix", price: 549, category: "Streaming", domain: "netflix.com" },
  { name: "Spotify", price: 149, category: "Streaming", domain: "spotify.com" },
  { name: "Disney+", price: 369, category: "Streaming", domain: "disneyplus.com" },
  { name: "YouTube Premium", price: 219, category: "Streaming", domain: "youtube.com" },
  { name: "Google One", price: 149, category: "Cloud", domain: "one.google.com" },
  { name: "Microsoft 365", price: 429, category: "Software", domain: "microsoft.com" },
  { name: "iCloud+", price: 149, category: "Cloud", domain: "apple.com" },
  { name: "Adobe Creative Cloud", price: 3499, category: "Software", domain: "adobe.com" },
  { name: "Canva Pro", price: 649, category: "Software", domain: "canva.com" },
  { name: "Prime Video", price: 249, category: "Streaming", domain: "primevideo.com" },
  { name: "Crunchyroll", price: 279, category: "Streaming", domain: "crunchyroll.com" },
  { name: "Steam", price: 0, category: "Gaming", domain: "steampowered.com" },
  { name: "Epic Games", price: 0, category: "Gaming", domain: "epicgames.com" },
  { name: "PLDT Home", price: 1699, category: "Internet", domain: "pldthome.com" },
  { name: "Globe Fiber", price: 2499, category: "Internet", domain: "globe.com.ph" },
  { name: "Converge", price: 1899, category: "Internet", domain: "convergeict.com" },
  { name: "Starlink", price: 5200, category: "Internet", domain: "starlink.com" },
  { name: "Sky Cable", price: 1299, category: "Internet", domain: "skycable.com" },
  { name: "ChatGPT Plus", price: 1149, category: "Software", domain: "openai.com" },
  { name: "Claude Pro", price: 1149, category: "Software", domain: "anthropic.com" },
  { name: "GitHub Copilot", price: 579, category: "Software", domain: "github.com" },
  { name: "Cursor", price: 1149, category: "Software", domain: "cursor.com" },
  { name: "Notion", price: 579, category: "Software", domain: "notion.so" },
  { name: "Dropbox", price: 649, category: "Cloud", domain: "dropbox.com" },
  { name: "OneDrive", price: 289, category: "Cloud", domain: "onedrive.live.com" },
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
    priceMonthly: 249,
    priceYearly: 2490,
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
    priceMonthly: 799,
    priceYearly: 7990,
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
    priceMonthly: 2499,
    priceYearly: 24990,
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
  { label: "Monthly savings", value: 48.2, prefix: "₱", suffix: "M" },
  { label: "Due this week", value: 3182, suffix: "" },
] as const;
