import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { saveProfileAction } from '@/lib/actions';
import { getCurrentUser, getFemaleProfileByUserId, getMaleProfileByUserId } from '@/lib/data';
import { maritalStatusLabel } from '@/lib/labels';

const VALUE_TAGS = ['落ち着いている', '誠実', '清潔感重視', 'よく笑う', '聞き上手', '優しい', 'アウトドア', 'インドア'] as const;

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const femaleProfile = await getFemaleProfileByUserId(user.id);
  const maleProfile = await getMaleProfileByUserId(user.id);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>プロフィール編集</h1>
          <p className='mt-2 text-sm leading-6 text-slate-500'>審査制・生活相性重視のプロフィールに整えましょう。</p>
        </article>

        <form action={saveProfileAction} className='space-y-3'>
          <input type='hidden' name='userId' value={user.id} />

          <article className='rounded-3xl border border-slate-100 bg-white p-4 text-sm shadow-sm'>
            <h2 className='mb-3 text-sm font-bold text-slate-900'>基本情報</h2>
            <div className='grid gap-2'>
              <label className='grid gap-1'>
                <span className='text-xs font-semibold text-slate-500'>プロフィール写真</span>
                <input type='file' name='profileImage' className='rounded-xl border border-slate-200 px-3 py-2' />
              </label>
              <input name='nickname' defaultValue={user.nickname} placeholder='ニックネーム' className='h-11 rounded-xl border border-slate-200 px-3' />
              <div className='grid grid-cols-2 gap-2'>
                <input name='location' defaultValue={user.location} placeholder='地域' className='h-11 rounded-xl border border-slate-200 px-3' />
                <input name='height' defaultValue={maleProfile?.height} placeholder='身長' className='h-11 rounded-xl border border-slate-200 px-3' />
              </div>
              {user.gender === 'male' ? (
                <div className='grid grid-cols-2 gap-2'>
                  <select name='maritalStatus' defaultValue={maleProfile?.maritalStatus ?? 'single'} className='h-11 rounded-xl border border-slate-200 px-3'>
                    <option value='single'>独身</option>
                    <option value='married'>既婚</option>
                    <option value='divorced'>離婚</option>
                    <option value='partner'>パートナーあり</option>
                  </select>
                  <label className='flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs text-slate-600'>
                    <input type='checkbox' name='hasChildren' defaultChecked={maleProfile?.hasChildren} /> 子供あり
                  </label>
                </div>
              ) : null}
              <textarea name='bio' defaultValue={user.bio} className='w-full rounded-xl border border-slate-200 px-3 py-2' rows={4} placeholder='自己紹介' />
            </div>
          </article>

          {user.gender === 'male' ? (
            <>
              <article className='rounded-3xl border border-slate-100 bg-white p-4 text-sm shadow-sm'>
                <h2 className='mb-3 text-sm font-bold text-slate-900'>ライフスタイル</h2>
                <div className='grid grid-cols-2 gap-2'>
                  <input name='job' defaultValue={maleProfile?.job} placeholder='職種' className='h-11 rounded-xl border border-slate-200 px-3' />
                  <input name='income' defaultValue={maleProfile?.income} placeholder='年収' className='h-11 rounded-xl border border-slate-200 px-3' />
                  <input name='smoking' defaultValue={maleProfile?.smoking} placeholder='喫煙' className='h-11 rounded-xl border border-slate-200 px-3' />
                  <input name='drinking' defaultValue={maleProfile?.drinking} placeholder='飲酒' className='h-11 rounded-xl border border-slate-200 px-3' />
                  <input name='holiday' defaultValue={maleProfile?.holiday} placeholder='休日' className='h-11 rounded-xl border border-slate-200 px-3' />
                  <input name='firstDateCost' defaultValue={maleProfile?.firstDateCost} placeholder='初回デート費用' className='h-11 rounded-xl border border-slate-200 px-3' />
                </div>
                <div className='mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600'>
                  <label className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2'>
                    <input type='checkbox' name='nightShiftUnderstanding' defaultChecked={maleProfile?.nightShiftUnderstanding} /> 夜勤理解
                  </label>
                  <label className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2'>
                    <input type='checkbox' name='shiftWorkUnderstanding' defaultChecked={maleProfile?.shiftWorkUnderstanding} /> シフト勤務理解
                  </label>
                  <label className='col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2'>
                    <input type='checkbox' name='lateNightContactOk' defaultChecked={maleProfile?.lateNightContactOk} /> 深夜連絡OK
                  </label>
                </div>
                <p className='mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500'>婚姻状態: {maleProfile ? maritalStatusLabel(maleProfile.maritalStatus) : '-'}（虚偽申告は禁止）</p>
              </article>

              <article className='rounded-3xl border border-slate-100 bg-white p-4 text-sm shadow-sm'>
                <h2 className='mb-3 text-sm font-bold text-slate-900'>性格・価値観（タグ選択）</h2>
                <div className='flex flex-wrap gap-2'>
                  {VALUE_TAGS.map((tag) => (
                    <label key={tag} className='rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700'>
                      <input
                        type='checkbox'
                        name='personalityTag'
                        value={tag}
                        defaultChecked={Boolean(maleProfile?.personalityTags?.includes(tag))}
                        className='mr-1'
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </article>

              <article className='rounded-3xl border border-slate-100 bg-white p-4 text-sm shadow-sm'>
                <h2 className='mb-3 text-sm font-bold text-slate-900'>希望条件</h2>
                <p className='text-xs leading-6 text-slate-500'>年齢・地域・独身のみ・年収・喫煙/飲酒・職種の条件は女性側検索に反映されます。</p>
              </article>
            </>
          ) : (
            <article className='rounded-3xl border border-pink-100 bg-pink-50/60 p-4 text-sm shadow-sm'>
              <h2 className='mb-2 text-sm font-bold text-pink-700'>看護師プロフィール情報</h2>
              <select name='workplaceType' defaultValue={femaleProfile?.workplaceType} className='h-11 w-full rounded-xl border border-slate-200 bg-white px-3'>
                <option value='hospital'>病院</option>
                <option value='clinic'>クリニック</option>
                <option value='beauty'>美容</option>
                <option value='nightshift'>夜勤あり</option>
                <option value='other'>その他</option>
              </select>
              <label className='mt-2 flex items-center gap-2'>
                <input type='checkbox' name='hasNightShift' defaultChecked={femaleProfile?.hasNightShift} /> 夜勤あり
              </label>
              <label className='mt-2 grid gap-1'>
                看護師資格書類を再提出
                <input type='file' name='nurseDocument' className='rounded-xl border border-slate-200 bg-white px-3 py-2' />
              </label>
              <p className='mt-1 text-xs text-pink-700'>再提出時は看護師確認ステータスが pending に戻ります。</p>
            </article>
          )}

          <button className='h-12 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white'>保存する</button>
        </form>

        <article className='grid grid-cols-2 gap-2 rounded-3xl border border-slate-100 bg-white p-4 text-xs shadow-sm'>
          <Link href='/blocked-users' className='rounded-xl border border-slate-200 px-3 py-2 text-center text-slate-700'>
            ブロック管理
          </Link>
          <Link href='/delete-account' className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-red-600'>
            退会導線
          </Link>
        </article>
      </section>
    </AppShell>
  );
}
