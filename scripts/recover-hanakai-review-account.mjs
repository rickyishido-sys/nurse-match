#!/usr/bin/env node
/**
 * Recover (or report) the HANAKAI App Store review account on Production.
 *
 * Production schema notes (do not assume email on hanakai_members):
 * - Event host: hanakai_events.host_member_id → hanakai_members.id
 * - Auth link:  hanakai_members.auth_user_id → auth.users.id
 * - Email:      Supabase Auth only (admin.getUserById / listUsers)
 * - Identity:   identity_verified, trust_verification_status, document_upload_status
 * - Profile:    nickname + gender + area + (age_band || age >= 18)
 *
 * Usage:
 *   node scripts/recover-hanakai-review-account.mjs --dry-run
 *   node scripts/recover-hanakai-review-account.mjs --apply
 *
 * --dry-run: read-only. Never resets password or writes .env.
 * --apply:   resets password for the selected candidate and writes
 *            HANAKAI_REVIEW_* into .env.secrets.local (gitignored).
 *
 * Secrets are never printed. Emails are masked in logs.
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SECRETS_FILE = resolve(ROOT, ".env.secrets.local");
const PRODUCTION_URL = "https://hanakai.kranz.design";

const REVIEW_EVENT_ID = "a27f5be8-a875-461c-9fd1-adfb936410ff";
const REVIEW_EVENT_TITLE = "HANAKAI 体験イベント（審査用）";

const MEMBER_SELECT = [
  "id",
  "auth_user_id",
  "nickname",
  "gender",
  "area",
  "age",
  "age_band",
  "bio",
  "avatar_url",
  "identity_verified",
  "trust_verification_status",
  "document_upload_status",
  "status",
  "deleted_at",
  "created_at",
  "updated_at",
].join(", ");

const EVENT_SELECT =
  "id, title, host_member_id, host_name, status, start_at, created_at";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function upsertEnvFile(path, updates) {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = existing ? existing.split(/\r?\n/) : [];
  const keys = new Set(Object.keys(updates));
  const next = [];
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (m && keys.has(m[1])) {
      next.push(`${m[1]}=${updates[m[1]]}`);
      keys.delete(m[1]);
    } else if (line.length > 0 || next.length === 0) {
      next.push(line);
    }
  }
  for (const key of keys) next.push(`${key}=${updates[key]}`);
  const body = `${next.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").replace(/\n*$/, "")}\n`;
  writeFileSync(path, body, { mode: 0o600 });
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return "(none)";
  const [local, domain] = email.split("@");
  const keep = Math.min(2, local.length);
  return `${local.slice(0, keep)}***@${domain}`;
}

function looksLikeE2E(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("e2e") ||
    t.includes("smoke") ||
    t.includes("nursematch") ||
    t.includes("playwright") ||
    t.includes("test@") ||
    t.includes("+test")
  );
}

/** Same rules as src/lib/hanakai/profile.ts isHanakaiProfileComplete */
function isProfileComplete(m) {
  if (!m?.nickname?.trim()) return false;
  if (!m?.gender) return false;
  if (!m?.area?.trim()) return false;
  if (m.age_band) return true;
  if (typeof m.age === "number" && Number.isFinite(m.age) && m.age >= 18) return true;
  return false;
}

function generatePassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(24);
  let out = "";
  for (let i = 0; i < 20; i++) out += alphabet[bytes[i] % alphabet.length];
  return `Hk!${out}`;
}

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");
  if (dryRun === apply) {
    console.error("Specify exactly one of --dry-run or --apply");
    process.exit(2);
  }
  return { dryRun, apply };
}

async function getAuthUser(admin, authUserId) {
  if (!authUserId) return { user: null, error: "no auth_user_id" };
  const { data, error } = await admin.auth.admin.getUserById(authUserId);
  if (error) return { user: null, error: error.message };
  return { user: data.user ?? null, error: null };
}

function scoreCandidate(c) {
  let score = 0;
  const reasons = [];

  if (c.hostsReviewEvent) {
    score += 100;
    reasons.push(`hosts review event (${REVIEW_EVENT_TITLE})`);
  }
  if (c.nickname && /審査/.test(c.nickname)) {
    score += 40;
    reasons.push(`nickname contains 審査: ${c.nickname}`);
  }
  if (c.email && /審査|review|apple|appstore/i.test(c.email)) {
    score += 30;
    reasons.push(`email suggests review: ${maskEmail(c.email)}`);
  }
  if (c.email && /@hanakai\.kranz\.design$/i.test(c.email)) {
    score += 15;
    reasons.push("email on hanakai.kranz.design");
  }
  if (c.identity_verified === true) {
    score += 10;
    reasons.push("identity_verified=true");
  }
  if (c.trust_verification_status === "verified") {
    score += 8;
    reasons.push("trust_verification_status=verified");
  }
  if (c.document_upload_status === "approved") {
    score += 5;
    reasons.push("document_upload_status=approved");
  }
  if (c.profileComplete) {
    score += 10;
    reasons.push("profile complete (nickname/gender/area/age)");
  }
  if (c.authLinked) {
    score += 5;
    reasons.push("linked to Supabase Auth user");
  }
  if (c.deleted_at) {
    score -= 100;
    reasons.push("soft-deleted");
  }
  if (c.status && ["banned", "suspended", "inactive", "disabled"].includes(String(c.status))) {
    score -= 100;
    reasons.push(`member status=${c.status}`);
  }
  if (c.banned) {
    score -= 100;
    reasons.push("Auth user banned");
  }
  if (looksLikeE2E(c.nickname) || looksLikeE2E(c.email)) {
    score -= 200;
    reasons.push("looks like Smoke/E2E (excluded)");
  }

  return { score, reasons };
}

async function main() {
  const { dryRun, apply } = parseArgs(process.argv.slice(2));
  const fileEnv = loadEnvFile(SECRETS_FILE);
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    fileEnv.NEXT_PUBLIC_SUPABASE_URL ||
    fileEnv.SUPABASE_URL;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (env or .env.secrets.local).",
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Mode: ${dryRun ? "dry-run (read-only)" : "apply"}`);
  console.log(`Supabase: ${url}`);
  console.log(`App: ${PRODUCTION_URL}`);
  console.log("");

  // --- STEP 1: review event by known id / title ---
  console.log("STEP1: Identify App Store review account candidates (values masked)");

  let reviewEvent = null;
  {
    const { data, error } = await admin
      .from("hanakai_events")
      .select(EVENT_SELECT)
      .eq("id", REVIEW_EVENT_ID)
      .maybeSingle();
    if (error) {
      console.log(`review_event by id failed: ${error.message}`);
    } else if (data) {
      reviewEvent = data;
    }
  }
  if (!reviewEvent) {
    const { data, error } = await admin
      .from("hanakai_events")
      .select(EVENT_SELECT)
      .eq("title", REVIEW_EVENT_TITLE)
      .limit(5);
    if (error) {
      console.log(`review_event by title failed: ${error.message}`);
    } else if (data?.[0]) {
      reviewEvent = data[0];
    }
  }

  console.log(
    "review_event:",
    reviewEvent
      ? {
          found: true,
          id: reviewEvent.id,
          title: reviewEvent.title,
          host_member_id: reviewEvent.host_member_id,
          host_name: reviewEvent.host_name,
          status: reviewEvent.status,
        }
      : { found: false },
  );

  /** @type {Map<string, any>} */
  const byId = new Map();

  async function addMember(member, source) {
    if (!member?.id) return;
    const existing = byId.get(member.id) || {
      id: member.id,
      auth_user_id: member.auth_user_id,
      nickname: member.nickname,
      gender: member.gender,
      area: member.area,
      age: member.age,
      age_band: member.age_band,
      identity_verified: member.identity_verified,
      trust_verification_status: member.trust_verification_status,
      document_upload_status: member.document_upload_status,
      status: member.status,
      deleted_at: member.deleted_at,
      created_at: member.created_at,
      sources: [],
      hostsReviewEvent: false,
    };
    if (!existing.sources.includes(source)) existing.sources.push(source);
    if (source === "review_event_host") existing.hostsReviewEvent = true;
    // Prefer freshest row fields
    for (const k of [
      "auth_user_id",
      "nickname",
      "gender",
      "area",
      "age",
      "age_band",
      "identity_verified",
      "trust_verification_status",
      "document_upload_status",
      "status",
      "deleted_at",
      "created_at",
    ]) {
      if (member[k] !== undefined && member[k] !== null) existing[k] = member[k];
    }
    byId.set(member.id, existing);
  }

  if (reviewEvent?.host_member_id) {
    const { data, error } = await admin
      .from("hanakai_members")
      .select(MEMBER_SELECT)
      .eq("id", reviewEvent.host_member_id)
      .maybeSingle();
    if (error) console.log(`host member lookup failed: ${error.message}`);
    else if (data) await addMember(data, "review_event_host");
  }

  // Nickname / host_name patterns (not Smoke/E2E)
  {
    const { data, error } = await admin
      .from("hanakai_members")
      .select(MEMBER_SELECT)
      .or("nickname.ilike.%審査%,nickname.ilike.%review%,nickname.ilike.%Apple%")
      .is("deleted_at", null)
      .limit(30);
    if (error) console.log(`nickname search failed: ${error.message}`);
    else for (const m of data || []) await addMember(m, "nickname_pattern");
  }

  // Enrich from Auth (email lives here, not on hanakai_members)
  const candidates = [];
  for (const m of byId.values()) {
    const { user, error: authErr } = await getAuthUser(admin, m.auth_user_id);
    const email = user?.email || null;
    if (looksLikeE2E(m.nickname) || looksLikeE2E(email)) {
      console.log(
        `skip Smoke/E2E candidate: member_id=${m.id} nickname=${m.nickname || "(none)"} email=${maskEmail(email)}`,
      );
      continue;
    }
    const profileComplete = isProfileComplete(m);
    const row = {
      ...m,
      email,
      authLinked: Boolean(user),
      authError: authErr,
      banned: Boolean(user?.banned_until),
      authCreatedAt: user?.created_at || null,
      profileComplete,
    };
    const { score, reasons } = scoreCandidate(row);
    candidates.push({ ...row, score, reasons });
  }

  // Also scan Auth users whose email suggests review (paginate lightly)
  {
    let page = 1;
    const perPage = 200;
    let scanned = 0;
    while (page <= 5) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.log(`listUsers failed: ${error.message}`);
        break;
      }
      const users = data?.users || [];
      if (users.length === 0) break;
      for (const u of users) {
        scanned += 1;
        const email = u.email || "";
        if (!email) continue;
        if (looksLikeE2E(email)) continue;
        const reviewish =
          /審査|review|apple|appstore/i.test(email) ||
          /@hanakai\.kranz\.design$/i.test(email);
        if (!reviewish) continue;
        if ([...byId.values()].some((m) => m.auth_user_id === u.id)) continue;

        const { data: mem, error: memErr } = await admin
          .from("hanakai_members")
          .select(MEMBER_SELECT)
          .eq("auth_user_id", u.id)
          .maybeSingle();
        if (memErr) {
          console.log(`member by auth_user_id failed: ${memErr.message}`);
          continue;
        }
        if (!mem) continue;
        if (looksLikeE2E(mem.nickname)) continue;
        await addMember(mem, "auth_email_pattern");
        const profileComplete = isProfileComplete(mem);
        const row = {
          ...mem,
          email,
          authLinked: true,
          authError: null,
          banned: Boolean(u.banned_until),
          authCreatedAt: u.created_at || null,
          profileComplete,
          hostsReviewEvent: mem.id === reviewEvent?.host_member_id,
          sources: ["auth_email_pattern"],
        };
        const { score, reasons } = scoreCandidate(row);
        if (!candidates.some((c) => c.id === row.id)) {
          candidates.push({ ...row, score, reasons });
        }
      }
      if (users.length < perPage) break;
      page += 1;
    }
    console.log(`auth_email_scan: scanned=${scanned} pages<=5`);
  }

  candidates.sort((a, b) => b.score - a.score);

  console.log("");
  console.log(`candidates: ${candidates.length}`);
  for (const c of candidates.slice(0, 10)) {
    console.log("---");
    console.log(
      JSON.stringify(
        {
          member_id: c.id,
          auth_user_id: c.auth_user_id || null,
          auth_linked: c.authLinked,
          email_masked: maskEmail(c.email),
          nickname: c.nickname || null,
          identity_verified: c.identity_verified,
          trust_verification_status: c.trust_verification_status,
          document_upload_status: c.document_upload_status,
          profile_complete: c.profileComplete,
          status: c.status,
          deleted_at: c.deleted_at,
          created_at: c.created_at,
          score: c.score,
          rationale: c.reasons,
          sources: c.sources,
        },
        null,
        2,
      ),
    );
  }

  const best = candidates[0] || null;
  const clearReviewAccount =
    Boolean(best) &&
    best.score >= 100 &&
    best.hostsReviewEvent &&
    best.authLinked &&
    Boolean(best.email) &&
    !looksLikeE2E(best.nickname) &&
    !looksLikeE2E(best.email);

  console.log("");
  console.log(
    clearReviewAccount
      ? "VERDICT: A — 明確な既存審査用アカウントが存在する"
      : "VERDICT: B — 明確な審査用アカウントは存在しない",
  );

  if (!best) {
    console.log("No non-E2E candidate found. Stopping (no password change).");
    process.exit(clearReviewAccount ? 0 : 0);
  }

  if (!best.auth_user_id || !best.authLinked) {
    console.log("Best candidate has no Auth user link. Stopping.");
    process.exit(1);
  }
  if (!best.email) {
    console.log("Best candidate has no Auth email. Stopping.");
    process.exit(1);
  }

  console.log("");
  console.log("Selected candidate (masked):");
  console.log(
    JSON.stringify(
      {
        member_id: best.id,
        auth_user_id: best.auth_user_id,
        auth_linked: best.authLinked,
        email_masked: maskEmail(best.email),
        identity_verified: best.identity_verified,
        trust_verification_status: best.trust_verification_status,
        document_upload_status: best.document_upload_status,
        profile_complete: best.profileComplete,
        created_at: best.created_at,
        rationale: best.reasons,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("");
    console.log(
      "dry-run complete. No password change, no Auth/DB update, no .env write.",
    );
    process.exit(0);
  }

  // --- APPLY only below ---
  if (!clearReviewAccount) {
    console.error(
      "Refusing --apply: no clear review account (VERDICT B). Re-run after manual confirmation.",
    );
    process.exit(1);
  }

  console.log("");
  console.log("STEP2: Reset Auth password (profile/identity untouched)");
  const newPassword = generatePassword();
  const { data: updated, error: updErr } = await admin.auth.admin.updateUserById(
    best.auth_user_id,
    { password: newPassword },
  );
  if (updErr) {
    console.error(`password reset failed: ${updErr.message}`);
    process.exit(1);
  }
  console.log(
    `password reset ok for auth_user_id=${updated.user?.id || best.auth_user_id}`,
  );

  console.log("");
  console.log("STEP3: Write credentials to .env.secrets.local (gitignored)");
  upsertEnvFile(SECRETS_FILE, {
    HANAKAI_REVIEW_EMAIL: best.email,
    HANAKAI_REVIEW_PASSWORD: newPassword,
    NEXT_PUBLIC_SUPABASE_URL: url,
    // keep service role if already present — do not strip
  });
  // Preserve service role if file already had it
  const after = loadEnvFile(SECRETS_FILE);
  if (!after.SUPABASE_SERVICE_ROLE_KEY && serviceRole) {
    upsertEnvFile(SECRETS_FILE, { SUPABASE_SERVICE_ROLE_KEY: serviceRole });
  }
  console.log(`wrote HANAKAI_REVIEW_EMAIL / HANAKAI_REVIEW_PASSWORD to ${SECRETS_FILE}`);
  console.log("Password value is not printed.");

  console.log("");
  console.log("STEP4: Verify sign-in (no profile/identity mutation)");
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    fileEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!anonKey) {
    console.log(
      "No anon/publishable key in env — skip client signIn; use verify-hanakai-review-login.mjs next.",
    );
  } else {
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signed, error: signErr } = await userClient.auth.signInWithPassword({
      email: best.email,
      password: newPassword,
    });
    if (signErr) {
      console.error(`signInWithPassword failed: ${signErr.message}`);
      process.exit(1);
    }
    console.log(
      `sign-in ok: user_id=${signed.user?.id} session=${Boolean(signed.session)}`,
    );
    await userClient.auth.signOut();
  }

  console.log("");
  console.log("DONE. Next:");
  console.log("  node scripts/verify-hanakai-review-login.mjs");
  console.log("  node scripts/capture-app-store-screenshots.mjs");
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
