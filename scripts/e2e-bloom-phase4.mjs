#!/usr/bin/env node
/**
 * Bloom Profile Phase 4 — production smoke test via Supabase REST + public pages.
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from '@supabase/supabase-js';

const BASE = process.env.HANAKAI_BASE_URL ?? 'https://hanakai.kranz.design';
const MEMBER_ID = process.env.HANAKAI_TEST_MEMBER_ID ?? 'd3020954-b304-4da2-8ca6-f350e0a3c52b';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

async function main() {
  const results = [];

  // 1. Timeline insert
  const timelineTitle = `E2E Timeline ${Date.now()}`;
  const { data: timelineRow, error: timelineErr } = await sb
    .from('hanakai_bloom_timeline')
    .insert({
      member_id: MEMBER_ID,
      type: 'bio_updated',
      title: timelineTitle,
      visibility: 'public',
    })
    .select('*')
    .single();

  results.push({
    step: 'timeline_insert',
    ok: !timelineErr && !!timelineRow,
    detail: timelineErr?.message ?? timelineRow?.id,
  });

  // 2. Memory insert (need event_id - pick any past event or null)
  const { data: events } = await sb.from('hanakai_events').select('id, title').limit(1);
  const eventId = events?.[0]?.id ?? null;
  const memoryText =
    '今日は花屋さんと話せた。普段知らない世界の話を聞けて面白かった。新しい視点が広がった気がする。';

  let memoryOk = false;
  if (eventId) {
    const { data: memRow, error: memErr } = await sb
      .from('hanakai_bloom_memories')
      .upsert(
        {
          member_id: MEMBER_ID,
          event_id: eventId,
          memory: memoryText,
          visibility: 'public',
        },
        { onConflict: 'member_id,event_id' },
      )
      .select('*')
      .single();
    memoryOk = !memErr && !!memRow;
    results.push({ step: 'memory_upsert', ok: memoryOk, detail: memErr?.message ?? memRow?.id });
  } else {
    results.push({ step: 'memory_upsert', ok: false, detail: 'no event found' });
  }

  // 3. Version insert
  const { data: versionRow, error: versionErr } = await sb
    .from('hanakai_bloom_versions')
    .insert({
      member_id: MEMBER_ID,
      summary_title: 'E2E Version',
      summary: 'テスト用の Bloom Summary バージョンです。',
      connection_style: 'ゆっくり話すタイプ',
      conversation_starters: ['最近参加したイベントは？', '興味が広がったことは？'],
      ai_tags: ['花', '対話'],
    })
    .select('*')
    .single();

  results.push({
    step: 'version_insert',
    ok: !versionErr && !!versionRow,
    detail: versionErr?.message ?? versionRow?.id,
  });

  // 4. AI reflection + public flags
  const reflection =
    '最近は花や植物だけではなく、人との会話そのものを楽しむ機会が増えているようです。様々な分野への興味が広がっている印象があります。';

  const { error: profileErr } = await sb
    .from('hanakai_bloom_profiles')
    .upsert(
      {
        member_id: MEMBER_ID,
        ai_reflection: reflection,
        show_timeline: true,
        show_memories: true,
        show_reflection: true,
      },
      { onConflict: 'member_id' },
    );

  results.push({ step: 'reflection_upsert', ok: !profileErr, detail: profileErr?.message ?? 'ok' });

  // 5. Public profile HTTP check
  const profileRes = await fetch(`${BASE}/profile/${MEMBER_ID}`);
  const profileHtml = await profileRes.text();
  const publicChecks = {
    http_ok: profileRes.ok,
    has_timeline: profileHtml.includes('Bloom Timeline') || profileHtml.includes(timelineTitle),
    has_reflection: profileHtml.includes('最近のあなた') || profileHtml.includes('ようです'),
    has_memory: profileHtml.includes('Bloom Memories') || profileHtml.includes('花屋'),
  };
  results.push({ step: 'public_profile', ok: publicChecks.http_ok, detail: publicChecks });

  console.log(JSON.stringify({ base: BASE, memberId: MEMBER_ID, results }, null, 2));

  const allOk = results.every((r) => r.ok);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
