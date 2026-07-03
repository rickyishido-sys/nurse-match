import Link from 'next/link';

export default function HanakaiAdminMemberNotFound() {
  return (
    <div className='mx-auto max-w-lg rounded-2xl border border-[#ebe7dd] bg-white px-8 py-12 text-center'>
      <p className='text-[11px] font-semibold tracking-[0.2em] text-[#1f5d4f]'>HANAKAI ADMIN</p>
      <h1 className='mt-3 text-xl font-semibold text-[#1a1a1a]'>会員が見つかりません</h1>
      <p className='mt-3 text-sm leading-7 text-[#6b6b6b]'>
        指定された会員 ID は存在しないか、削除されています。
      </p>
      <Link
        href='/admin/hanakai/members'
        className='mt-6 inline-flex rounded-full bg-[#1f5d4f] px-5 py-2.5 text-sm font-medium text-white'
      >
        会員一覧へ戻る
      </Link>
    </div>
  );
}
