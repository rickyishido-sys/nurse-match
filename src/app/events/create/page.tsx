import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { ConnectionPageError } from '@/components/connection/connection-page-error';
import { CreateEventForm } from '@/components/connection/events/create-event-form';
import { EVENT_CATEGORY_CREATE_ORDER, EVENT_CATEGORY_META } from '@/lib/connection/data';
import { ensureHanakaiMemberForAuthUser } from '@/lib/connection/identity';
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ConnectionEventCategory } from '@/lib/connection/types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = 'force-dynamic';

function buildCategoryOptions() {
  return EVENT_CATEGORY_CREATE_ORDER.flatMap((value) => {
    const meta = EVENT_CATEGORY_META[value as ConnectionEventCategory];
    if (!meta) return [];
    return [{ value, label: meta.short, emoji: meta.emoji }];
  });
}

export default async function CreateEventPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const error = sp.error === 'required';

  if (HANAKAI_CONNECTION_BACKEND === 'supabase') {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return (
        <ConnectionShell viewer={null}>
          <ConnectionPageError
            title='接続設定を確認できません'
            message='データベース接続の設定が見つかりませんでした。時間をおいて再度お試しください。'
            actionHref='/events'
            actionLabel='イベント一覧へ戻る'
          />
        </ConnectionShell>
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect('/login?next=/events/create');
    }

    const memberId = await ensureHanakaiMemberForAuthUser(user.id, {
      email: user.email,
      nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
    });
    if (!memberId) {
      const viewer = await getHanakaiViewer();
      return (
        <ConnectionShell viewer={viewer}>
          <ConnectionPageError
            title='プロフィールの準備ができていません'
            message='イベントを作成するには、会員プロフィールの登録が必要です。登録を完了してから再度お試しください。'
            actionHref='/register/profile'
            actionLabel='プロフィール登録へ'
          />
        </ConnectionShell>
      );
    }
  }

  const viewer = await getHanakaiViewer();
  const categories = buildCategoryOptions();

  if (categories.length === 0) {
    return (
      <ConnectionShell viewer={viewer}>
        <ConnectionPageError
          message='イベントカテゴリーの設定を読み込めませんでした。'
          actionHref='/events'
          actionLabel='イベント一覧へ戻る'
        />
      </ConnectionShell>
    );
  }

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-7'>
        <div className='space-y-3'>
          <Link href='/events' className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← イベント一覧へ
          </Link>
          <div>
            <p className='text-xs font-semibold tracking-[0.18em] text-[#1f5d4f]'>HOST YOUR CONNECTION</p>
            <h1 className='mt-2 text-2xl font-semibold leading-snug text-[#1a1a1a]'>
              あなたのConnectionを
              <br />
              ひらく
            </h1>
            <p className='mt-3 text-sm leading-7 text-[#6b6b6b]'>
              知らない誰かと、心地よい時間を。少人数で、丁寧に。
              <br />
              主催者であるあなたが、参加する人を選べます。
            </p>
          </div>
        </div>

        {error ? (
          <p className='rounded-2xl border border-[#f0d3d9] bg-[#fbf2f4] px-4 py-3 text-xs text-[#c0526b]'>
            イベント名・開催日時・エリアは必須です。もう一度ご確認ください。
          </p>
        ) : null}

        <CreateEventForm categories={categories} />
      </div>
    </ConnectionShell>
  );
}
