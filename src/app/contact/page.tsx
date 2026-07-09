import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { ContactForm } from '@/components/connection/contact-form';
import { LegalLinks } from '@/components/connection/legal-links';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';
import type { ContactInquiryCategory } from '@/lib/connection/contact-inquiry-constants';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export const metadata = {
  title: 'お問い合わせ',
  description: 'HANAKAI Connection へのお問い合わせ',
};

export default async function ContactPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const sent = param(sp, 'sent') === '1';
  const error = param(sp, 'error');
  const rawCategory = param(sp, 'category');
  const defaultCategory: ContactInquiryCategory =
    rawCategory === 'event' ||
    rawCategory === 'service' ||
    rawCategory === 'account_deletion' ||
    rawCategory === 'safety' ||
    rawCategory === 'other'
      ? rawCategory
      : 'service';

  const memberId = await getViewerMemberId();
  const member = memberId ? await getMember(memberId) : null;

  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <div className='mx-auto max-w-[520px] space-y-8'>
        <div className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
            CONTACT
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
            お問い合わせ
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            サービスに関するご質問・ご要望・安全に関するご相談は、以下のフォームよりお送りください。通常、数営業日以内にご返信いたします。
          </p>
        </div>

        {sent ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            お問い合わせを受け付けました。内容を確認のうえ、ご登録のメールアドレスへご連絡いたします。
          </p>
        ) : null}

        {error === 'required' ? (
          <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            必須項目を入力してください。
          </p>
        ) : null}

        <section className='rounded-3xl border border-[#ebe5dc] bg-white p-6 shadow-[0_2px_12px_rgba(26,26,26,0.04)]'>
          <ContactForm
            defaultName={member?.nickname ?? ''}
            defaultEmail={viewer?.email ?? ''}
            defaultCategory={defaultCategory}
          />
        </section>

        <p className='text-xs leading-6 text-[#9a9a9a]'>
          アカウント削除をご希望の場合は、
          <Link href='/account/delete' className='text-[#1f5d4f] underline-offset-2 hover:underline'>
            アカウント削除ページ
          </Link>
          からも手続きいただけます。お困りの際は種別で「アカウント削除について」をお選びください。
        </p>

        <LegalLinks className='text-[#6b6b6b]' />

        <Link
          href='/'
          className='inline-flex h-11 items-center justify-center rounded-full border border-[#d8d6d1] px-6 text-sm font-medium text-[#6b6b6b] transition active:scale-[0.98]'
        >
          トップへ戻る
        </Link>
      </div>
    </ConnectionShell>
  );
}
