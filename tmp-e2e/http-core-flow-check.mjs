const BASE_URL = 'https://nurse.kranz.design';
const FEMALE_EMAIL = 'test-female@nursematch.app';
const MALE_EMAIL = 'test-male@nursematch.app';
const PASSWORD = 'test1234';

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

function mergeCookies(jar, setCookieHeaders) {
  for (const row of setCookieHeaders) {
    const pair = row.split(';')[0];
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    jar.set(key, value);
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function request(path, jar, init = {}) {
  const headers = new Headers(init.headers ?? {});
  const c = cookieHeader(jar);
  if (c) headers.set('cookie', c);
  const res = await fetch(path.startsWith('http') ? path : `${BASE_URL}${path}`, { ...init, headers, redirect: 'manual' });
  mergeCookies(jar, getSetCookies(res.headers));
  return res;
}

function matchOne(text, regex, label) {
  const m = text.match(regex);
  if (!m) throw new Error(`parse failed: ${label}`);
  return m[1];
}

function parseFormActionId(html) {
  const m = html.match(/name=\"(\$ACTION_ID_[^\"]+)\"/);
  if (!m) throw new Error('server action id not found');
  return m[1];
}

async function login(email) {
  const jar = new Map();
  const loginPage = await request('/login', jar);
  const loginHtml = await loginPage.text();
  const actionId = parseFormActionId(loginHtml);

  const body = new FormData();
  body.set(actionId, '');
  body.set('email', email);
  body.set('password', PASSWORD);

  const posted = await request('/login', jar, { method: 'POST', body });
  const location = posted.headers.get('location') ?? '';
  if (!location) throw new Error(`login redirect missing for ${email}`);
  await request(location.startsWith('http') ? location : `${BASE_URL}${location}`, jar);
  return jar;
}

function parseDiscoverLikeForm(html) {
  const formBlock = matchOne(
    html,
    /<form[^>]*>[\s\S]*?name=\"toUserId\" value=\"([^\"]+)\"[\s\S]*?name=\"action\" value=\"like\"[\s\S]*?<button[^>]*>興味あり<\/button>[\s\S]*?<\/form>/,
    'discover like form',
  );
  const actionId = parseFormActionId(html);
  return { toUserId: formBlock, actionId };
}

function parseLikesReturnForm(html) {
  const formMatch = html.match(
    /<form[^>]*>[\s\S]*?name=\"fromUserId\" value=\"([^\"]+)\"[\s\S]*?name=\"toUserId\" value=\"([^\"]+)\"[\s\S]*?name=\"action\" value=\"like\"[\s\S]*?<button[^>]*>興味ありを返す<\/button>[\s\S]*?<\/form>/,
  );
  if (!formMatch) throw new Error('likes return form not found');
  const [, fromUserId, toUserId] = formMatch;
  const actionId = parseFormActionId(html);
  return { fromUserId, toUserId, actionId };
}

async function run() {
  const report = [];

  const femaleJar = await login(FEMALE_EMAIL);
  report.push('A: test-female login OK');

  const discoverRes = await request('/discover', femaleJar);
  const discoverHtml = await discoverRes.text();
  report.push(`B: /discover status=${discoverRes.status}`);
  report.push(`C: discover header present=${discoverHtml.includes('本日のおすすめ男性')}`);

  const discoverLike = parseDiscoverLikeForm(discoverHtml);
  const femaleLikeBody = new FormData();
  femaleLikeBody.set(discoverLike.actionId, '');
  const femaleId = matchOne(discoverHtml, /name=\"fromUserId\" value=\"([^\"]+)\"/, 'female fromUserId');
  femaleLikeBody.set('fromUserId', femaleId);
  femaleLikeBody.set('toUserId', discoverLike.toUserId);
  femaleLikeBody.set('action', 'like');
  const femaleLikeRes = await request('/discover', femaleJar, { method: 'POST', body: femaleLikeBody });
  report.push(`D: female like submit status=${femaleLikeRes.status}`);

  const maleJar = await login(MALE_EMAIL);
  report.push('E: test-male login OK');

  const likesRes = await request('/likes', maleJar);
  const likesHtml = await likesRes.text();
  report.push(`F: /likes status=${likesRes.status}`);
  report.push(`G: likes header present=${likesHtml.includes('興味を持たれました')}`);

  const returnLike = parseLikesReturnForm(likesHtml);
  const maleLikeBody = new FormData();
  maleLikeBody.set(returnLike.actionId, '');
  maleLikeBody.set('fromUserId', returnLike.fromUserId);
  maleLikeBody.set('toUserId', returnLike.toUserId);
  maleLikeBody.set('action', 'like');
  const returnRes = await request('/likes', maleJar, { method: 'POST', body: maleLikeBody });
  report.push(`H: male return-like submit status=${returnRes.status}`);

  const matchesRes = await request('/matches', maleJar);
  const matchesHtml = await matchesRes.text();
  report.push(`I: /matches status=${matchesRes.status}`);
  report.push(`I: matches header present=${matchesHtml.includes('マッチ一覧')}`);
  const messagePath = matchesHtml.match(/href=\"(\/messages\/[^\"]+)\"/)?.[1] ?? null;
  report.push(`I: messages link found=${Boolean(messagePath)} value=${messagePath ?? '-'}`);

  if (messagePath) {
    const msgRes = await request(messagePath, maleJar);
    const msgHtml = await msgRes.text();
    report.push(`J: /messages/[matchId] status=${msgRes.status}`);
    report.push(`J: message input present=${msgHtml.includes('メッセージを入力')}`);
    const femaleThread = await request(messagePath, femaleJar);
    report.push(`K: female opens same thread status=${femaleThread.status}`);
  }

  const femaleOnLikes = await request('/likes', femaleJar);
  report.push(`role-check: female /likes -> status=${femaleOnLikes.status} location=${femaleOnLikes.headers.get('location') ?? '-'}`);
  const maleOnDiscover = await request('/discover', maleJar);
  report.push(`role-check: male /discover -> status=${maleOnDiscover.status} location=${maleOnDiscover.headers.get('location') ?? '-'}`);

  for (const row of report) console.log(row);
}

run().catch((e) => {
  console.error('HTTP_E2E_ERROR', e.message);
  process.exit(1);
});

