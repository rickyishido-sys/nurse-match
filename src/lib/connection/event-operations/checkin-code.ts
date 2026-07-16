import { createHash, randomInt } from 'node:crypto';

const SALT = process.env.HANAKAI_CHECKIN_CODE_SALT ?? 'hanakai-checkin-v1';

export function generateCheckinCode(): { code: string; hash: string } {
  const code = String(randomInt(1000, 10000));
  return { code, hash: hashCheckinCode(code) };
}

export function hashCheckinCode(code: string): string {
  return createHash('sha256').update(`${SALT}:${code.trim()}`).digest('hex');
}

export function verifyCheckinCode(code: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || code.trim().length !== 4) return false;
  return hashCheckinCode(code) === storedHash;
}
