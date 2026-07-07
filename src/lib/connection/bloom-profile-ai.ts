import {
  AGE_BAND_LABEL,
  MBTI_LABEL,
  SOCIAL_PLATFORM_LABEL,
  type AgeBand,
  type MbtiType,
} from '@/lib/connection/bloom-profile-options';
import { INTEREST_TAG_LABEL, PURPOSE_LABEL, VALUE_TAG_LABEL } from '@/lib/connection/data';
import type { BloomProfileGenerated } from '@/lib/connection/bloom-profile-types';
import type { BloomIntroductionInput } from '@/lib/connection/bloom-introduction-ai';
import { memberToBloomIntroductionInput, isBloomAiEnabled } from '@/lib/connection/bloom-introduction-ai';

export { isBloomAiEnabled };

const FORBIDDEN_PATTERNS = [
  /rating/i,
  /score/i,
  /rank/i,
  /stars?/i,
  /偏差値/u,
  /相性点数/u,
  /ランキング/u,
  /マッチングアプリ/u,
  /婚活/u,
  /恋愛目的/u,
];

const TENTATIVE_MARKERS = [/ようです/u, /かもしれません/u, /印象があります/u, /印象/u, /ような/u, /らしい/u];

function buildBloomProfilePrompt(input: BloomIntroductionInput): string {
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
      : '未入力';
  const sns =
    input.socialLinks.length > 0
      ? input.socialLinks.map((l) => SOCIAL_PLATFORM_LABEL[l.platform] ?? l.platform).join('、')
      : '未登録';

  return [
    'あなたは HANAKAI Connection の Bloom Profile 作成アシスタントです。',
    '「人を理解して Connection する」ための、本人視点のプロフィール素材を JSON で返してください。',
    '',
    '【絶対禁止】',
    '- rating / score / rank / stars / 偏差値 / 相性点数 / ランキング の概念',
    '- 第三者評価（「この人は〜」）',
    '- 性格・価値観の断定（「〜な人です」「〜タイプです」と言い切らない）',
    '- 婚活・恋愛目的・マッチングアプリ的な文言',
    '',
    '【出力形式】以下の JSON のみ（説明文不要）',
    '{',
    '  "aiIntroduction": "本人視点の自己紹介 150〜300字。こんにちは。で始める",',
    '  "bloomSummaryTitle": "その人らしさを表す短いタイトル（例: 人との会話から広がるタイプ）",',
    '  "bloomSummary": "本人向けサマリー約100字。必ず「〜のようです」「〜かもしれません」「〜という印象があります」のいずれかを含める",',
    '  "conversationStarters": ["質問1", "質問2", "質問3", "質問4"],',
    '  "connectionStyle": "Connectionの傾向を一文で（断定禁止、例: 少人数でゆっくり話す時間を楽しむ印象があります）",',
    '  "talkTopics": ["話題1", "話題2", "話題3"],',
    '  "aiTags": ["花", "読書", "旅行"]',
    '}',
    '',
    '【本人入力データ】',
    `ニックネーム: ${input.nickname || '未入力'}`,
    `性別: ${input.gender}`,
    `年齢層: ${ageBand}`,
    `居住エリア: ${input.area || '未入力'}`,
    `MBTI: ${mbti}`,
    `趣味・興味: ${interests}`,
    `Connection目的: ${purposes}`,
    `価値観タグ: ${values}`,
    `登録SNS種別: ${sns}`,
  ].join('\n');
}

function parseGenerated(raw: string): BloomProfileGenerated {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  const aiIntroduction = String(parsed.aiIntroduction ?? '').trim();
  const bloomSummaryTitle = String(parsed.bloomSummaryTitle ?? '').trim();
  const bloomSummary = String(parsed.bloomSummary ?? '').trim();
  const connectionStyle = String(parsed.connectionStyle ?? '').trim();

  const conversationStarters = (Array.isArray(parsed.conversationStarters) ? parsed.conversationStarters : [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 5);

  const talkTopics = (Array.isArray(parsed.talkTopics) ? parsed.talkTopics : [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 3);

  const aiTags = (Array.isArray(parsed.aiTags) ? parsed.aiTags : [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 12);

  return {
    aiIntroduction,
    bloomSummaryTitle,
    bloomSummary,
    conversationStarters,
    connectionStyle,
    talkTopics,
    aiTags,
  };
}

function validateGenerated(data: BloomProfileGenerated): string | null {
  const allText = [
    data.aiIntroduction,
    data.bloomSummaryTitle,
    data.bloomSummary,
    data.connectionStyle,
    ...data.conversationStarters,
    ...data.talkTopics,
    ...data.aiTags,
  ].join(' ');

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(allText)) return 'forbidden';
  }

  if (!data.aiIntroduction || data.aiIntroduction.length < 100 || data.aiIntroduction.length > 400) {
    return 'intro_length';
  }
  if (!/^こんにちは/u.test(data.aiIntroduction)) return 'intro_opening';

  if (!data.bloomSummary || data.bloomSummary.length < 30 || data.bloomSummary.length > 200) {
    return 'summary_length';
  }
  if (!TENTATIVE_MARKERS.some((m) => m.test(data.bloomSummary))) return 'summary_tentative';

  if (data.conversationStarters.length < 3) return 'starters_count';
  if (data.talkTopics.length < 3) return 'topics_count';
  if (!data.connectionStyle.trim()) return 'style_empty';
  if (data.aiTags.length < 2) return 'tags_count';

  return null;
}

export async function generateBloomProfile(
  input: BloomIntroductionInput,
): Promise<BloomProfileGenerated> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'HANAKAI Connection の Bloom Profile 生成アシスタント。評価・ランキングは禁止。指定JSONのみ返す。',
        },
        { role: 'user', content: buildBloomProfilePrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('BLOOM_PROFILE_AI_FAILED', { status: response.status, detail: detail.slice(0, 300) });
    throw new Error('AI generation failed');
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content?.trim() ?? '';
  const generated = parseGenerated(raw);
  const issue = validateGenerated(generated);
  if (issue) {
    console.error('BLOOM_PROFILE_VALIDATE_FAILED', { issue, preview: raw.slice(0, 200) });
    throw new Error('AI output validation failed');
  }
  return generated;
}

export async function generateBloomProfileForMember(
  member: import('@/lib/connection/types').ConnectionMember,
): Promise<BloomProfileGenerated> {
  return generateBloomProfile(memberToBloomIntroductionInput(member));
}
