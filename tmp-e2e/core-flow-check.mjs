import { webkit } from '@playwright/test';

const BASE_URL = 'https://nurse.kranz.design';
const FEMALE_EMAIL = 'test-female@nursematch.app';
const MALE_EMAIL = 'test-male@nursematch.app';
const PASSWORD = 'test1234';

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL(/\/(home|pending-review|review-rejected|admin)/), page.click('button[type="submit"]')]);
}

async function run() {
  const browser = await webkit.launch({ headless: true });
  const femaleCtx = await browser.newContext();
  const maleCtx = await browser.newContext();
  const femalePage = await femaleCtx.newPage();
  const malePage = await maleCtx.newPage();
  const summary = [];

  try {
    await login(femalePage, FEMALE_EMAIL, PASSWORD);
    summary.push('A: test-female login OK');

    await femalePage.goto(`${BASE_URL}/discover`, { waitUntil: 'domcontentloaded' });
    summary.push(`B: /discover open -> ${femalePage.url()}`);

    const femaleBody = await femalePage.textContent('body');
    const discoverHasCards = (femaleBody ?? '').includes('本日のおすすめ男性');
    summary.push(`C: discover card section present=${discoverHasCards}`);

    const femaleLikeButton = femalePage.getByRole('button', { name: '興味あり' }).first();
    if (await femaleLikeButton.count()) {
      await femaleLikeButton.click();
      summary.push('D: female liked first card');
    } else {
      summary.push('D: female like button not found');
    }

    await login(malePage, MALE_EMAIL, PASSWORD);
    summary.push('E: test-male login OK');

    await malePage.goto(`${BASE_URL}/likes`, { waitUntil: 'domcontentloaded' });
    summary.push(`F: /likes open -> ${malePage.url()}`);

    const maleBody = await malePage.textContent('body');
    const likesHasSection = (maleBody ?? '').includes('興味を持たれました');
    summary.push(`G: likes section present=${likesHasSection}`);

    const returnLike = malePage.getByRole('button', { name: '興味ありを返す' }).first();
    if (await returnLike.count()) {
      await returnLike.click();
      summary.push('H: male returned like');
    } else {
      summary.push('H: return-like button not found');
    }

    await malePage.goto(`${BASE_URL}/matches`, { waitUntil: 'domcontentloaded' });
    const matchesBody = await malePage.textContent('body');
    const hasMatchList = (matchesBody ?? '').includes('マッチ一覧');
    summary.push(`I: /matches visible=${hasMatchList}`);

    const firstMatchLink = malePage.locator('a[href^="/messages/"]').first();
    if (await firstMatchLink.count()) {
      await firstMatchLink.click();
      await malePage.waitForURL(/\/messages\/.+/);
      const matchUrl = malePage.url();
      summary.push(`J: message thread opened -> ${matchUrl}`);
      await malePage.fill('input[placeholder*="メッセージ"]', 'E2E test message from male');
      await malePage.getByRole('button', { name: '送信' }).click();
      summary.push('J: male message sent');

      await femalePage.goto(matchUrl, { waitUntil: 'domcontentloaded' });
      const femaleThread = await femalePage.textContent('body');
      const sawMessage = (femaleThread ?? '').includes('E2E test message from male');
      summary.push(`K: female sees male message=${sawMessage}`);
    } else {
      summary.push('J/K: no /messages/[matchId] link found');
    }

    await femalePage.goto(`${BASE_URL}/likes`, { waitUntil: 'domcontentloaded' });
    summary.push(`role-check female /likes -> ${femalePage.url()}`);
    await malePage.goto(`${BASE_URL}/discover`, { waitUntil: 'domcontentloaded' });
    summary.push(`role-check male /discover -> ${malePage.url()}`);
  } finally {
    await femaleCtx.close();
    await maleCtx.close();
    await browser.close();
  }

  for (const line of summary) console.log(line);
}

run().catch((err) => {
  console.error('E2E_ERROR', err);
  process.exit(1);
});

