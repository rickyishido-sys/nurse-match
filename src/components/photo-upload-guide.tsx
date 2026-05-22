type PhotoUploadGuideProps = {
  audience?: 'all' | 'male' | 'female';
};

export function PhotoUploadGuide({ audience = 'all' }: PhotoUploadGuideProps) {
  return (
    <article className='rounded-2xl border border-slate-200 bg-slate-50/80 p-3'>
      <p className='text-sm font-semibold text-slate-900'>写真登録ガイド</p>
      <p className='mt-1 text-xs leading-6 text-slate-600'>
        安心してマッチングできるよう、あなたの雰囲気が伝わる写真を登録してください。
      </p>

      <details className='mt-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700'>
        <summary className='cursor-pointer list-none font-semibold text-slate-800'>詳しく見る</summary>
        <div className='mt-3 space-y-3 leading-6'>
          <section>
            <p className='font-semibold text-emerald-700'>OK例</p>
            <ul className='mt-1 space-y-1'>
              <li>・明るい場所で撮影した写真</li>
              <li>・顔や雰囲気が分かる写真</li>
              <li>・自然な笑顔の写真</li>
              <li>・服装や清潔感が伝わる写真</li>
              <li>・趣味や日常が伝わる写真</li>
            </ul>
          </section>

          <section>
            <p className='font-semibold text-rose-700'>NG例</p>
            <ul className='mt-1 space-y-1'>
              <li>・顔がまったく分からない写真</li>
              <li>・過度な加工やAI生成に見える写真</li>
              <li>・他人が写り込んでいる写真</li>
              <li>・職場や病院名が分かる写真</li>
              <li>・本人確認書類や資格証を公開画像に使うこと</li>
              <li>・露出が多すぎる写真</li>
              <li>・暗すぎる写真</li>
              <li>・攻撃的、不適切、違法性のある写真</li>
            </ul>
          </section>

          {audience !== 'male' ? (
            <section className='rounded-xl border border-pink-100 bg-pink-50 p-2 text-pink-700'>
              <p className='font-semibold'>看護師向け注意</p>
              <p className='mt-1'>
                職場・病院名・名札・患者情報などが写り込まないようにしてください。看護師資格確認書類は公開プロフィール画像には使用しないでください。
              </p>
            </section>
          ) : null}

          {audience !== 'female' ? (
            <section className='rounded-xl border border-sky-100 bg-sky-50 p-2 text-sky-700'>
              <p className='font-semibold'>男性向け注意</p>
              <p className='mt-1'>男性は顔が分かる写真が1枚以上必要です。清潔感や雰囲気が伝わる写真を登録してください。</p>
            </section>
          ) : null}

          <section className='rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600'>
            <p className='font-semibold text-slate-700'>写真ステータス</p>
            <ul className='mt-1 space-y-1'>
              <li>・写真確認中</li>
              <li>・写真確認済み</li>
              <li>・写真を変更してください</li>
            </ul>
            <p className='mt-1'>公開プロフィール画像（最大3枚）と、本人確認書類・看護師資格確認書類は別管理です。</p>
          </section>
        </div>
      </details>
    </article>
  );
}
