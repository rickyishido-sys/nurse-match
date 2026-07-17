/**
 * Playwright context helpers for Vercel Preview (*.vercel.app) deployments.
 * Uses Vercel's official automation bypass headers when VERCEL_AUTOMATION_BYPASS_SECRET is set.
 * Never put the bypass secret in URLs — headers only — so errors and logs stay safe.
 */
export function isVercelPreviewHost(baseUrl) {
  try {
    return new URL(baseUrl).hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

export function resolveVercelBypassSecret(env = {}) {
  return process.env.VERCEL_AUTOMATION_BYPASS_SECRET || env.VERCEL_AUTOMATION_BYPASS_SECRET || '';
}

/** Strip sensitive query params before logging errors. */
export function sanitizeUrlForLog(url) {
  try {
    const parsed = new URL(url);
    for (const key of ['x-vercel-protection-bypass', 'x-vercel-set-bypass-cookie']) {
      if (parsed.searchParams.has(key)) parsed.searchParams.set(key, '[redacted]');
    }
    return parsed.toString();
  } catch {
    return '[invalid-url]';
  }
}

export async function createHanakaiPreviewContext(browser, baseUrl, env) {
  const bypassSecret = resolveVercelBypassSecret(env);
  const useBypass = isVercelPreviewHost(baseUrl) && Boolean(bypassSecret);

  const context = await browser.newContext(
    useBypass
      ? {
          extraHTTPHeaders: {
            'x-vercel-protection-bypass': bypassSecret,
            'x-vercel-set-bypass-cookie': 'true',
          },
        }
      : {},
  );

  if (useBypass) {
    const primer = await context.newPage();
    await primer
      .goto(`${baseUrl.replace(/\/$/, '')}/login`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      })
      .catch(() => null);
    await primer.close();
  }

  return { context, bypassSecret, useBypass };
}

export async function waitForHanakaiLoginForm(page, timeoutMs = 45_000) {
  await page.waitForSelector('text=おかえりなさい', { timeout: timeoutMs });
  await page.waitForSelector('input[name="password"]', { timeout: 10_000 });
}

export async function assertHanakaiReachable(page, baseUrl) {
  const loginUrl = `${baseUrl.replace(/\/$/, '')}/login`;
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });

  const url = page.url();
  if (url.includes('vercel.com/login') || url.includes('vercel.com/sso-api')) {
    throw new Error(
      'Preview *.vercel.app redirected to vercel.com (Vercel Authentication). Playwright needs x-vercel-protection-bypass or an active Vercel team session.',
    );
  }

  try {
    await waitForHanakaiLoginForm(page);
  } catch {
    const title = await page.title().catch(() => '');
    const bodyLen = await page.locator('body').innerText().then((t) => t.length).catch(() => 0);
    throw new Error(
      `HANAKAI login form not found at ${sanitizeUrlForLog(url)} (title=${JSON.stringify(title)}, bodyLen=${bodyLen})`,
    );
  }
}
