import type { BloomMemory } from '@/lib/connection/bloom-phase4-types';
import { isBloomAiEnabled } from '@/lib/connection/bloom-introduction-ai';

const FORBIDDEN = [/rating/i, /score/i, /rank/i, /stars?/i, /偏差値/u, /ランキング/u];
const TENTATIVE = [/ようです/u, /印象があります/u, /かもしれません/u, /ような/u];

export type ReflectionInput = {
  memories: BloomMemory[];
  recentTimelineTitles: string[];
  currentSummary: string;
};

export async function generateAiReflection(input: ReflectionInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  if (input.memories.length === 0 && input.recentTimelineTitles.length === 0) {
    return '';
  }

  const memoryText = input.memories
    .map((m) => (m.eventTitle ? `【${m.eventTitle}】${m.memory}` : m.memory))
    .join('\n');

  const prompt = [
    'あなたは HANAKAI Connection の Bloom Reflection アシスタントです。',
    '参加者本人向けに「最近のあなた」を2〜4文で書いてください。',
    '',
    '【厳守】',
    '- 評価・ランキング・スコア・点数の概念は禁止',
    '- 断定禁止。必ず「〜ようです」「〜印象があります」「〜かもしれません」を含める',
    '- 本人視点の温かい文章。第三者評価はしない',
    '- 出力は本文のみ',
    '',
    '【Bloom Summary（参考）】',
    input.currentSummary || '未設定',
    '',
    '【最近のTimeline】',
    input.recentTimelineTitles.join('、') || 'なし',
    '',
    '【Bloom Memories】',
    memoryText || 'なし',
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'HANAKAI Bloom Reflection。評価ではなく理解のための文章のみ返す。',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error('AI reflection failed');

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content?.trim() ?? '';

  for (const p of FORBIDDEN) {
    if (p.test(text)) throw new Error('forbidden content');
  }
  if (!TENTATIVE.some((m) => m.test(text))) throw new Error('missing tentative tone');

  return text;
}

export { isBloomAiEnabled };
