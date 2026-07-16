import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { ConnectionPageError } from '@/components/connection/connection-page-error';
import { IdentityRequiredPanel } from '@/components/connection/identity-required-panel';
import { CreateEventForm } from '@/components/connection/events/create-event-form';
import { EVENT_CATEGORY_CREATE_ORDER, EVENT_CATEGORY_META } from '@/lib/connection/data';
import { ensureHanakaiMemberForAuthUser, getViewerMemberId } from '@/lib/connection/identity';
import { getEventEligibility } from '@/lib/connection/identity-gate';
import { getMember } from '@/lib/connection/repo';
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

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: string }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT;')
  );
}

function logPageError(error: unknown) {
  console.error('EVENT_CREATE_PAGE_ERROR', error);
  if (error instanceof Error) {
    console.error('EVENT_CREATE_PAGE_ERROR_MESSAGE', error.message);
    console.error('EVENT_CREATE_PAGE_ERROR_STACK', error.stack);
  }
}

export default async function CreateEventPage({ searchParams }: PageProps) {
  try {
    console.log('EVENT_CREATE_1_START', {
      backend: HANAKAI_CONNECTION_BACKEND,
    });

    const sp = searchParams ? await searchParams : {};
    const validationError = sp.error === 'required';

    if (HANAKAI_CONNECTION_BACKEND === 'supabase') {
      const supabase = await createServerSupabaseClient();
      if (!supabase) {
        console.log('EVENT_CREATE_2_SESSION_FAIL', { reason: 'supabase_client_null' });
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

      // /events は middleware 公開のため、ここでセッション更新を試みる
      await supabase.auth.getSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('EVENT_CREATE_2_SESSION_OK', {
        hasUser: Boolean(user),
        userId: user?.id ?? null,
      });

      if (!user) {
        console.log('EVENT_CREATE_2_SESSION_NO_USER_REDIRECT');
        redirect('/login?next=/events/create');
      }

      const memberId = await ensureHanakaiMemberForAuthUser(user.id, {
        email: user.email,
        nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
      });
      console.log('EVENT_CREATE_3_MEMBER_OK', {
        memberId: memberId ?? null,
      });

      if (!memberId) {
        console.log('EVENT_CREATE_3_MEMBER_FAIL', { userId: user.id });
        const viewer = await getHanakaiViewer();
        console.log('EVENT_CREATE_UI_PROFILE_REQUIRED');
        return (
          <ConnectionShell viewer={viewer}>
            <ConnectionPageError
              title='プロフィールの準備ができていません'
              message='イベントを作るには、会員プロフィールの登録が必要です。登録を完了してから再度お試しください。'
              actionHref='/register/profile'
              actionLabel='プロフィール登録へ'
            />
          </ConnectionShell>
        );
      }
    }

    const viewer = await getHanakaiViewer();
    const categories = buildCategoryOptions();
    const viewerMemberId = await getViewerMemberId();
    const member = viewerMemberId ? await getMember(viewerMemberId) : null;
    const eligibility = getEventEligibility(member);
    if (viewerMemberId && !eligibility.isVerified) {
      return (
        <ConnectionShell viewer={viewer}>
          <div className='space-y-7'>
            <Link href='/events' className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
              ← イベント一覧へ
            </Link>
            <IdentityRequiredPanel laterHref='/my-profile' />
          </div>
        </ConnectionShell>
      );
    }

    console.log('EVENT_CREATE_4_CATEGORIES_OK', {
      count: categories.length,
      orderLength: EVENT_CATEGORY_CREATE_ORDER.length,
    });

    if (categories.length === 0) {
      console.log('EVENT_CREATE_4_CATEGORIES_EMPTY', {
        metaKeyCount: Object.keys(EVENT_CATEGORY_META).length,
        orderLength: EVENT_CATEGORY_CREATE_ORDER.length,
      });
      console.log('EVENT_CREATE_UI_CATEGORIES_EMPTY');
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

    console.log('EVENT_CREATE_5_RENDER', {
      categoryCount: categories.length,
      hasViewer: Boolean(viewer),
    });

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

          {validationError ? (
            <p className='rounded-2xl border border-[#f0d3d9] bg-[#fbf2f4] px-4 py-3 text-xs text-[#c0526b]'>
              イベント名・開催日時・エリアは必須です。もう一度ご確認ください。
            </p>
          ) : null}

          <CreateEventForm categories={categories} />
        </div>
      </ConnectionShell>
    );
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    logPageError(error);
    console.log('EVENT_CREATE_UI_CATCH');
    return (
      <ConnectionShell viewer={null}>
        <ConnectionPageError
          message='イベント作成ページの読み込み中に問題が発生しました。しばらくしてからもう一度お試しください。'
          actionHref='/events'
          actionLabel='イベント一覧へ戻る'
        />
      </ConnectionShell>
    );
  }
}
