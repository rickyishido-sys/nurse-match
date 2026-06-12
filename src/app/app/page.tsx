import { redirect } from 'next/navigation';
import Image from 'next/image';
import { AppShell } from '@/components/app-shell';
import { getAccessState, requireUser } from '@/lib/guard';

const DUMMY_CARDS = [
  { id: 'c1', age: 29, location: '東京都', line: '夜勤明けにほっとできる会話が好きです。', image: '/onboarding/welcome.png' },
  { id: 'c2', age: 33, location: '神奈川県', line: '休日はカフェ巡りと散歩をしています。', image: '/onboarding/discover.png' },
  { id: 'c3', age: 27, location: '大阪府', line: '穏やかな関係を大切にしたいです。', image: '/onboarding/message.png' },
];

export default async function AppCardsPage() {
  const user = await requireUser();
  const state = await getAccessState(user);

  if (state === 'pending') redirect('/pending-review');
  if (state === 'rejected') redirect('/review-rejected');
  if (state === 'suspended') redirect('/suspended');

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <h1 className='text-xl font-bold text-slate-900'>カード一覧（仮）</h1>
        <div className='grid gap-3 md:grid-cols-3'>
          {DUMMY_CARDS.map((card) => (
            <article key={card.id} className='overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm'>
              <Image src={card.image} alt='カード画像' width={640} height={480} className='h-56 w-full object-cover' />
              <div className='space-y-1 p-4 text-sm'>
                <p className='font-semibold text-slate-900'>{card.age}歳 / {card.location}</p>
                <p className='text-slate-600'>{card.line}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

