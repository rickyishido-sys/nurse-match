/**
 * 主催者一括決定フロー — モックバックエンド統合テスト
 * Usage: node scripts/e2e-host-participant-finalize.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  process.env.HANAKAI_CONNECTION_BACKEND = 'mock';

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const root = path.join(__dirname, '..');
  const outDir = path.join(root, 'scripts/e2e-screenshots/host-participant-finalize');
  mkdirSync(outDir, { recursive: true });

  const { finalizeEventParticipants } = await import('../src/lib/connection/participation-finalize');
  const mock = await import('../src/lib/connection/data');

  type Result = { name: string; ok: boolean; detail?: string };
  const results: Result[] = [];

  function record(name: string, ok: boolean, detail = '') {
    results.push({ name, ok, detail });
    console.log(ok ? 'PASS' : 'FAIL', name, detail);
  }

  const hostId = 'm1';
  const event = mock.createEvent({
    title: 'E2E 選定テスト',
    category: 'coffee',
    description: 'finalize flow test',
    startAt: '2026-08-01T10:00:00+09:00',
    area: '東京',
    venue: 'TEST',
    capacity: 2,
    fee: 0,
    coverUrl: 'https://example.com/cover.jpg',
    conditions: 'test',
    approvalMode: 'host_approval',
    hostId,
  });

  for (const memberId of ['m3', 'm5', 'm7']) {
    mock.applyToEvent(event.id, memberId, `E2E apply ${memberId}`);
    await new Promise((resolve) => setTimeout(resolve, 2));
  }

  const pending = mock.listApplications(event.id).filter((a) => a.status === 'pending');
  record('seed pending applications exist', pending.length === 3, `count=${pending.length}`);

  const ids = pending.slice(0, 2).map((a) => a.id);

  const bad = await finalizeEventParticipants({
    eventId: event.id,
    selectedApplicationIds: [],
    decidedByMemberId: hostId,
  });
  record('reject zero selection', !bad.ok, bad.ok ? '' : bad.error);

  const over = await finalizeEventParticipants({
    eventId: event.id,
    selectedApplicationIds: pending.map((a) => a.id),
    decidedByMemberId: hostId,
  });
  record('reject over capacity', !over.ok, over.ok ? '' : over.error);

  const wrongHost = await finalizeEventParticipants({
    eventId: event.id,
    selectedApplicationIds: ids,
    decidedByMemberId: 'm99-not-host',
  });
  record('reject non-host', !wrongHost.ok, wrongHost.ok ? '' : wrongHost.error);

  const foreignId = await finalizeEventParticipants({
    eventId: event.id,
    selectedApplicationIds: [...ids, 'foreign-app-id'],
    decidedByMemberId: hostId,
  });
  record('reject invalid application id', !foreignId.ok, foreignId.ok ? '' : foreignId.error);

  const crossEvent = await finalizeEventParticipants({
    eventId: event.id,
    selectedApplicationIds: [...ids, 'a5'],
    decidedByMemberId: hostId,
  });
  record('reject cross-event application id', !crossEvent.ok, crossEvent.ok ? '' : crossEvent.error);

  const ok = await finalizeEventParticipants({
    eventId: event.id,
    selectedApplicationIds: ids,
    decidedByMemberId: hostId,
  });
  record('finalize success', ok.ok, ok.ok ? `selected=${ok.selectedCount}` : ok.error);

  if (ok.ok) {
    const appsAfter = mock.listApplications(event.id);
    for (const id of ids) {
      const app = appsAfter.find((a) => a.id === id);
      record(`selected app ${id} awaiting_confirmation`, app?.status === 'awaiting_confirmation');
    }
    const rejected = appsAfter.filter((a) => a.status === 'rejected');
    record('not selected marked rejected internally', rejected.length === 1, `count=${rejected.length}`);
    record('event participantsDecidedAt set', Boolean(mock.getEvent(event.id)?.participantsDecidedAt));

    const dup = await finalizeEventParticipants({
      eventId: event.id,
      selectedApplicationIds: ids,
      decidedByMemberId: hostId,
    });
    record('prevent double finalize', !dup.ok, dup.ok ? '' : dup.error);
  }

  const report = {
    stamp: new Date().toISOString(),
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    results,
  };
  writeFileSync(path.join(outDir, 'mock-finalize-report.json'), JSON.stringify(report, null, 2));
  console.log('\nSummary:', report.pass, 'pass,', report.fail, 'fail');
  process.exit(report.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
