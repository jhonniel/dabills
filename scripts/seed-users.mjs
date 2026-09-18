/**
 * Seed local admin + user accounts in Supabase Auth + profiles,
 * plus landing-page showcase subscription plans.
 *
 * Usage:
 *   npm run db:seed
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * Optional (for role promotion if trigger blocks service role):
 *   SUPABASE_DB_PASSWORD
 *
 * Credentials:
 *   Admin  admin@dabills.app   / DaBillsAdmin1!
 *   User   jordan@example.com  / DaBillsUser1!
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function loadEnvLocal() {
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) {
    throw new Error("Missing .env.local — copy from .env.example first.");
  }
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env;
}

const SEED_ACCOUNTS = [
  {
    email: "admin@dabills.app",
    password: "DaBillsAdmin1!",
    fullName: "DaBills Admin",
    role: "admin",
  },
  {
    email: "jordan@example.com",
    password: "DaBillsUser1!",
    fullName: "Jordan Lee",
    role: "user",
  },
];

/** Same samples as SHOWCASE_SUBSCRIPTIONS on the landing page */
const SHOWCASE_PLANS = [
  { name: "Netflix", price: 549, category: "streaming", domain: "netflix.com", capacity: 4 },
  { name: "Spotify", price: 149, category: "streaming", domain: "spotify.com", capacity: 4 },
  { name: "Disney+", price: 369, category: "streaming", domain: "disneyplus.com", capacity: 4 },
  { name: "YouTube Premium", price: 219, category: "streaming", domain: "youtube.com", capacity: 4 },
  { name: "Google One", price: 149, category: "cloud", domain: "one.google.com", capacity: 5 },
  { name: "Microsoft 365", price: 429, category: "software", domain: "microsoft.com", capacity: 5 },
  { name: "iCloud+", price: 149, category: "cloud", domain: "apple.com", capacity: 5 },
  { name: "Adobe Creative Cloud", price: 3499, category: "software", domain: "adobe.com", capacity: 5 },
  { name: "Canva Pro", price: 649, category: "software", domain: "canva.com", capacity: 5 },
  { name: "Prime Video", price: 249, category: "streaming", domain: "primevideo.com", capacity: 4 },
  { name: "Crunchyroll", price: 279, category: "streaming", domain: "crunchyroll.com", capacity: 4 },
  { name: "Steam", price: 0, category: "gaming", domain: "steampowered.com", capacity: 1 },
  { name: "Epic Games", price: 0, category: "gaming", domain: "epicgames.com", capacity: 1 },
  { name: "PLDT Home", price: 1699, category: "internet", domain: "pldthome.com", capacity: 1 },
  { name: "Globe Fiber", price: 2499, category: "internet", domain: "globe.com.ph", capacity: 1 },
  { name: "Converge", price: 1899, category: "internet", domain: "convergeict.com", capacity: 1 },
  { name: "Starlink", price: 5200, category: "internet", domain: "starlink.com", capacity: 1 },
  { name: "Sky Cable", price: 1299, category: "internet", domain: "skycable.com", capacity: 1 },
  { name: "ChatGPT Plus", price: 1149, category: "software", domain: "openai.com", capacity: 5 },
  { name: "Claude Pro", price: 1149, category: "software", domain: "anthropic.com", capacity: 5 },
  { name: "GitHub Copilot", price: 579, category: "software", domain: "github.com", capacity: 5 },
  { name: "Cursor", price: 1149, category: "software", domain: "cursor.com", capacity: 5 },
  { name: "Notion", price: 579, category: "software", domain: "notion.so", capacity: 5 },
  { name: "Dropbox", price: 649, category: "cloud", domain: "dropbox.com", capacity: 5 },
  { name: "OneDrive", price: 289, category: "cloud", domain: "onedrive.live.com", capacity: 5 },
];

async function seedShowcasePlans(admin) {
  const { data: categories, error: catError } = await admin
    .from("categories")
    .select("id, slug");
  if (catError) throw catError;

  const categoryBySlug = Object.fromEntries(
    (categories ?? []).map((c) => [c.slug, c.id])
  );

  const { data: existing, error: existingError } = await admin
    .from("subscription_plans")
    .select("id, name");
  if (existingError) throw existingError;

  const byName = new Map((existing ?? []).map((p) => [p.name, p.id]));
  let count = 0;

  for (const plan of SHOWCASE_PLANS) {
    const row = {
      name: plan.name,
      category_id: categoryBySlug[plan.category] ?? null,
      logo_url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(plan.domain)}&sz=128`,
      amount: plan.price,
      currency: "PHP",
      billing_frequency: "monthly",
      custom_interval_days: null,
      max_capacity: plan.capacity,
      status: "active",
      notes:
        plan.price === 0
          ? "Variable billing · from landing showcase"
          : "From landing showcase",
    };

    const existingId = byName.get(plan.name);
    if (existingId) {
      const { error } = await admin
        .from("subscription_plans")
        .update(row)
        .eq("id", existingId);
      if (error) throw error;
    } else {
      const { error } = await admin.from("subscription_plans").insert(row);
      if (error) throw error;
    }
    count += 1;
  }

  return count;
}

async function upsertAuthUser(admin, account) {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  const existing = listed.users.find(
    (u) => u.email?.toLowerCase() === account.email.toLowerCase()
  );

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error) throw error;
    return { user: data.user, created: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: account.fullName },
  });
  if (error) throw error;
  return { user: data.user, created: true };
}

async function ensureProfile(admin, userId, account) {
  const now = new Date().toISOString();
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: account.email,
      full_name: account.fullName,
      role: account.role,
      updated_at: now,
    },
    { onConflict: "id" }
  );

  if (!error) return { ok: true };

  // Non-role fields first if trigger blocks role changes
  await admin
    .from("profiles")
    .update({
      email: account.email,
      full_name: account.fullName,
      updated_at: now,
    })
    .eq("id", userId);

  return { ok: false, reason: error.message };
}

async function promoteRolesViaSql(env, emailsByRole) {
  const password = env.SUPABASE_DB_PASSWORD;
  if (!password) {
    throw new Error(
      "Role update blocked. Set SUPABASE_DB_PASSWORD in .env.local and re-run, or apply migration 007."
    );
  }

  let Client;
  try {
    ({ Client } = require("pg"));
  } catch {
    throw new Error(
      'Install pg to finish role seeding: npm install -D pg\nThen re-run npm run db:seed'
    );
  }

  const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const hosts = [
    "aws-1-ap-south-1.pooler.supabase.com",
    "aws-0-ap-south-1.pooler.supabase.com",
    "aws-1-ap-southeast-1.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
  ];

  let lastError;
  for (const host of hosts) {
    const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:6543/postgres`;
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000,
    });
    try {
      await client.connect();
      const migration = resolve(
        ROOT,
        "supabase/migrations/007_service_role_set_role.sql"
      );
      if (existsSync(migration)) {
        await client.query(readFileSync(migration, "utf8"));
      }
      await client.query(
        "alter table public.profiles disable trigger protect_profile_role"
      );
      for (const [email, role] of Object.entries(emailsByRole)) {
        await client.query(
          `update public.profiles set role = $1, updated_at = timezone('utc', now()) where email = $2`,
          [role, email]
        );
      }
      await client.query(
        "alter table public.profiles enable trigger protect_profile_role"
      );
      await client.end();
      return;
    } catch (error) {
      lastError = error;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }

  throw lastError ?? new Error("Could not connect to Supabase Postgres pooler");
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes("your-project") || key.includes("your-")) {
    throw new Error(
      "Configure real NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding DaBills accounts…\n");

  const needsSqlRole = {};

  for (const account of SEED_ACCOUNTS) {
    const { user, created } = await upsertAuthUser(admin, account);
    const profile = await ensureProfile(admin, user.id, account);
    if (!profile.ok) {
      needsSqlRole[account.email] = account.role;
    }
    console.log(
      `${created ? "Created" : "Updated"}  ${account.role.padEnd(5)}  ${account.email}  /  ${account.password}`
    );
  }

  if (Object.keys(needsSqlRole).length > 0) {
    console.log("\nPromoting roles via database…");
    await promoteRolesViaSql(env, needsSqlRole);
    console.log("Roles updated.");
  }

  console.log("\nSeeding subscription plans from landing showcase…");
  const planCount = await seedShowcasePlans(admin);
  console.log(`OK  ${planCount} plans`);

  // Verify passwords work
  const pub = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log("\nVerifying logins…");
  for (const account of SEED_ACCOUNTS) {
    const { error } = await pub.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    if (error) {
      throw new Error(`Login failed for ${account.email}: ${error.message}`);
    }
    console.log(`OK  ${account.email}`);
    await pub.auth.signOut();
  }

  console.log("\nDone. Sign in at /login with the credentials above.");
}

main().catch((err) => {
  const detail = err?.cause?.code || err?.code || err.message || err;
  console.error("\nSeed failed:", detail);
  if (
    String(detail).includes("ENOTFOUND") ||
    String(detail).includes("fetch failed")
  ) {
    console.error(
      "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL (project may be paused)."
    );
  }
  process.exit(1);
});
