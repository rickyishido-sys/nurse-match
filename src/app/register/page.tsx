import { AppShell } from '@/components/app-shell';
import { registerAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/data';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/guard';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user && isAdminRole(user.role)) {
    if (user.role === 'female_admin') redirect('/admin/female');
    if (user.role === 'male_admin') redirect('/admin/male');
    redirect('/admin');
  }

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)]'>
          <h1 className='text-xl font-bold text-slate-900'>仮登録</h1>
          <p className='mt-1 text-xs text-slate-500'>メールアドレス・パスワード・性別・生年月日・居住地・ニックネームで開始できます。</p>
        </article>

        <form action={registerAction} className='space-y-4'>
          <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
            <h2 className='mb-3 text-sm font-bold text-slate-900'>1. 基本情報</h2>
            <div className='space-y-3 text-sm'>
              <label className='grid gap-1'>
                メールアドレス
                <input type='email' name='email' required className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1'>
                パスワード
                <input type='password' name='password' required minLength={8} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1'>
                性別
                <select name='gender' defaultValue={user?.gender ?? 'female'} className='h-11 rounded-xl border border-slate-200 px-3'>
                  <option value='female'>女性</option>
                  <option value='male'>男性</option>
                </select>
              </label>
              <label className='grid gap-1'>
                ニックネーム
                <input name='nickname' required className='h-11 rounded-xl border border-slate-200 px-3' defaultValue={user?.nickname ?? ''} />
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <label className='grid gap-1'>
                  生年月日
                  <input type='date' name='birthdate' required className='h-11 rounded-xl border border-slate-200 px-3' defaultValue={user?.birthdate ?? ''} />
                </label>
                <label className='grid gap-1'>
                  年齢
                  <input type='number' name='age' min={18} required className='h-11 rounded-xl border border-slate-200 px-3' defaultValue={user?.age ?? 20} />
                </label>
              </div>
            </div>
          </article>

          <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
            <h2 className='mb-3 text-sm font-bold text-slate-900'>2. 初期プロフィール</h2>
            <div className='space-y-3 text-sm'>
              <label className='grid gap-1'>
                居住地
                <input name='location' className='h-11 rounded-xl border border-slate-200 px-3' defaultValue={user?.location ?? ''} />
              </label>
              <label className='grid gap-1'>
                自己紹介
                <textarea name='bio' rows={4} className='rounded-xl border border-slate-200 px-3 py-2' defaultValue={user?.bio ?? ''} />
              </label>
              <label className='grid gap-1'>
                希望する相手の性別
                <select name='desiredGender' defaultValue={user?.desiredGender ?? 'both'} className='h-11 rounded-xl border border-slate-200 px-3'>
                  <option value='male'>男性</option>
                  <option value='female'>女性</option>
                  <option value='both'>両方</option>
                </select>
              </label>
            </div>
          </article>

          <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
            <h2 className='mb-3 text-sm font-bold text-slate-900'>3. 追加情報（任意）</h2>
            <div className='space-y-3 text-sm'>
              <label className='grid gap-1'>
                プロフィール写真
                <input type='file' name='profileImage' className='rounded-xl border border-slate-200 px-3 py-2' />
              </label>
              <label className='grid gap-1'>
                本人確認書類 (必須)
                <input type='file' name='identityDocument' className='rounded-xl border border-slate-200 px-3 py-2' />
              </label>

              <div className='rounded-2xl border border-pink-100 bg-pink-50/70 p-3'>
                <p className='mb-2 text-xs font-semibold text-pink-700'>女性向け: 看護師資格確認</p>
                <div className='space-y-2'>
                  <input type='file' name='nurseDocument' className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2' />
                  <select name='workplaceType' className='h-11 w-full rounded-xl border border-slate-200 bg-white px-3'>
                    <option value='hospital'>病院</option>
                    <option value='clinic'>クリニック</option>
                    <option value='beauty'>美容</option>
                    <option value='nightshift'>夜勤あり</option>
                    <option value='other'>その他</option>
                  </select>
                </div>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
                <p className='mb-2 text-xs font-semibold text-slate-700'>男性向け審査項目（必須）</p>
                <div className='grid grid-cols-2 gap-2'>
                  <input name='job' placeholder='職種' className='h-11 rounded-xl border border-slate-200 bg-white px-3' />
                  <input name='income' placeholder='年収' className='h-11 rounded-xl border border-slate-200 bg-white px-3' />
                  <select name='maritalStatus' className='h-11 rounded-xl border border-slate-200 bg-white px-3'>
                    <option value='single'>独身</option>
                    <option value='married'>既婚</option>
                    <option value='divorced'>離婚</option>
                    <option value='partner'>パートナーあり</option>
                  </select>
                  <input name='height' placeholder='身長' className='h-11 rounded-xl border border-slate-200 bg-white px-3' />
                  <input name='bodyType' placeholder='体型' className='h-11 rounded-xl border border-slate-200 bg-white px-3' />
                  <input name='holiday' placeholder='休日' className='h-11 rounded-xl border border-slate-200 bg-white px-3' />
                  <input name='smoking' placeholder='喫煙' className='h-11 rounded-xl border border-slate-200 bg-white px-3' />
                  <input name='drinking' placeholder='飲酒' className='h-11 rounded-xl border border-slate-200 bg-white px-3' />
                </div>
              </div>
            </div>
          </article>

          <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
            <h2 className='mb-3 text-sm font-bold text-slate-900'>4. 確認</h2>
            <p className='mb-3 text-xs text-slate-500'>仮登録後は /preview で雰囲気を確認できます。接触機能は本人確認後に解放されます。</p>
            <button className='h-12 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white'>仮登録する</button>
          </article>
        </form>
      </section>
    </AppShell>
  );
}
