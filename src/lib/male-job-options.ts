export const MALE_JOB_OPTIONS = [
  '会社員',
  '経営者',
  '医師',
  '看護師',
  '公務員',
  '士業',
  'IT',
  '金融',
  '不動産',
  '自営業',
  'その他',
] as const;

type MaleJobOption = (typeof MALE_JOB_OPTIONS)[number];

const MALE_JOB_SET = new Set<string>(MALE_JOB_OPTIONS);

export function normalizeMaleJob(value: string | null | undefined): MaleJobOption | '' {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  if (MALE_JOB_SET.has(normalized)) return normalized as MaleJobOption;
  return 'その他';
}
