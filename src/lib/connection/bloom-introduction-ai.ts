import {
  AGE_BAND_LABEL,
  MBTI_LABEL,
  SOCIAL_PLATFORM_LABEL,
  type AgeBand,
  type MbtiType,
  type SocialLinkPlatform,
} from '@/lib/connection/bloom-profile-options';
import { INTEREST_TAG_LABEL, PURPOSE_LABEL, VALUE_TAG_LABEL } from '@/lib/connection/data';
import type { ConnectionMember, InterestTag, ValueTag } from '@/lib/connection/types';

const GENDER_LABEL: Record<ConnectionMember['gender'], string> = {
  female: '女性',
  male: '男性',
  other: 'その他 / 未回答',
};

const FORBIDDEN_PATTERNS = [
  /この人は/u,
  /彼は/u,
  /彼女は/u,
  /rating/i,
  /score/i,
  /rank/i,
  /stars?/i,
  /マッチングアプリ/u,
  /婚活/u,
  /恋愛目的/u,
];

export type BloomIntroductionInput = {
  nickname: string;
  gender: ConnectionMember['gender'];
  ageBand: AgeBand | '';
  area: string;
  mbtiType: MbtiType | '';
  interestTags: InterestTag[];
  purposes: ConnectionMember['purposes'];
  valueTags: ValueTag[];
  socialLinks: { platform: SocialLinkPlatform; url: string }[];
};

export function memberToBloomIntroductionInput(member: ConnectionMember): BloomIntroductionInput {
  return {
    nickname: member.nickname,
    gender: member.gender,
    ageBand: member.ageBand,
    area: member.area,
    mbtiType: member.mbtiType,
    interestTags: member.interestTags,
    purposes: member.purposes,
    valueTags: member.values.valueTags ?? [],
    socialLinks: member.socialLinks.map((link) => ({ platform: link.platform, url: link.url })),
  };
}

function buildPrompt(input: BloomIntroductionInput): string {
  const interests = input.interestTags.map((t) => INTEREST_TAG_LABEL[t] ?? t).join('、') || '未入力';
  const purposes = input.purposes.map((p) => PURPOSE_LABEL[p] ?? p).join('、') || '未入力';
  const values = input.valueTags.map((t) => VALUE_TAG_LABEL[t] ?? t).join('、') || '未入力';
  const ageBand =
    input.ageBand && input.ageBand in AGE_BAND_LABEL
      ? AGE_BAND_LABEL[input.ageBand as AgeBand]
      : '未入力';
  const mbti =
    input.mbtiType && input.mbtiType !== 'unknown'
      ? (MBTI_LABEL[input.mbtiType as MbtiType] ?? input.mbtiType)
      : '未入力 / あとで入力';
  const sns =
    input.socialLinks.length > 0
      ? input.socialLinks
          .map((l) => `${SOCIAL_PLATFORM_LABEL[l.platform] ?? l.platform}（URL登録済み）`)
          .join('、')
      : '未登録';

  return [
    'あなたは HANAKAI Connection のプロフィール作成アシスタントです。',
    '本人がそのままプロフィールに貼れる、一人称の自己紹介文の下書きを1つだけ作成してください。',
    '',
    '【厳守】',
    '- 一人称で書く（「私は〜」「こんにちは。〜」で始める）',
    '- 第三者評価は禁止（「この人は〜」など書かない）',
    '- 性格の断定や診断結果の言い切りはしない',
    '- 性別・年齢層は入力値のみ使用し、推測しない',
    '- rating / score / rank / stars の概念は使わない',
    '- 婚活・恋愛目的・マッチングアプリ的な文言は避ける',
    '- 条件より体験や自然な Connection を大切にする雰囲気にする',
    '- 150〜300字程度、自然で押しつけがましくない日本語',
    '- 出力は自己紹介文のみ（説明や箇条書き不要）',
    '',
    '【本人入力データ】',
    `ニックネーム: ${input.nickname || '未入力'}`,
    `性別: ${GENDER_LABEL[input.gender]}`,
    `年齢層: ${ageBand}`,
    `居住エリア: ${input.area || '未入力'}`,
    `MBTI / 16タイプ: ${mbti}`,
    `趣味・興味: ${interests}`,
    `Connection目的: ${purposes}`,
    `価値観タグ: ${values}`,
    `登録SNS: ${sns}`,
  ].join('\n');
}

export function validateIntroductionDraft(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';
  if (trimmed.length < 80 || trimmed.length > 400) return 'length';
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) return 'forbidden';
  }
  if (!/^私は|^こんにちは/u.test(trimmed)) return 'opening';
  return null;
}

export async function generateBloomIntroductionDraft(input: BloomIntroductionInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content:
            'あなたは HANAKAI Connection 向けの自己紹介文下書きライターです。本人視点の自然な日本語のみを返してください。',
        },
        { role: 'user', content: buildPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('BLOOM_AI_GENERATE_FAILED', { status: response.status, detail: detail.slice(0, 300) });
    throw new Error('AI generation failed');
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content?.trim() ?? '';
  const cleaned = raw.replace(/^["「]|["」]$/g, '').trim();
  const issue = validateIntroductionDraft(cleaned);
  if (issue) {
    console.error('BLOOM_AI_VALIDATE_FAILED', { issue, preview: cleaned.slice(0, 120) });
    throw new Error('AI output validation failed');
  }
  return cleaned;
}

export function isBloomAiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
