type PhotoUploadGuideProps = {
  audience?: 'all' | 'male' | 'female';
};

export function PhotoUploadGuide({ audience = 'all' }: PhotoUploadGuideProps) {
  return (
    <article className='rounded-2xl border border-[#ebe9e4] bg-[#fbfaf7] p-3'>
      <p className='text-sm font-semibold text-[#1a1a1a]'>写真登録ガイド</p>
      <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>
        安心して交流できるよう、あなたの雰囲気が伝わる写真を登録してください。
      </p>

      <details className='mt-2 rounded-xl border border-[#ebe9e4] bg-white p-3 text-xs text-[#6b6b6b]'>
        <summary className='cursor-pointer list-none font-semibold text-[#1a1a1a]'>詳しく見る</summary>
        <div className='mt-3 space-y-3 leading-6'>
          <section>
            <p className='font-semibold text-[#1f5d4f]'>OK例</p>
            <ul className='mt-1 space-y-1'>
              <li>・明るい場所で撮影した写真</li>
              <li>・顔や雰囲気が分かる写真</li>
              <li>・自然な笑顔の写真</li>
              <li>・清潔感が伝わる写真</li>
              <li>・趣味や日常が伝わる写真</li>
            </ul>
          </section>

          <section>
            <p className='font-semibold text-rose-700'>NG例</p>
            <ul className='mt-1 space-y-1'>
              <li>・顔がまったく分からない写真</li>
              <li>・過度な加工やAI生成に見える写真</li>
              <li>・他人が写り込んでいる写真</li>
              <li>・職場名や個人を特定できる情報が写り込む写真</li>
              <li>・本人確認書類を公開画像に使うこと</li>
              <li>・露出が多すぎる写真</li>
              <li>・暗すぎる写真</li>
              <li>・攻撃的、不適切、違法性のある写真</li>
            </ul>
          </section>

          {audience !== 'male' ? (
            <section className='rounded-xl border border-[#ebe9e4] bg-[#f3f7f5] p-2 text-[#3a4742]'>
              <p className='font-semibold'>プライバシーに関する注意</p>
              <p className='mt-1'>
                職場名・名札・個人を特定できる情報が写り込まないようにしてください。確認用書類は公開プロフィール画像には使用しないでください。
              </p>
            </section>
          ) : null}

          {audience !== 'female' ? (
            <section className='rounded-xl border border-[#ebe9e4] bg-[#f3f7f5] p-2 text-[#3a4742]'>
              <p className='font-semibold'>男性向け注意</p>
              <p className='mt-1'>顔が分かる写真が1枚以上必要です。清潔感や雰囲気が伝わる写真を登録してください。</p>
            </section>
          ) : null}

          <section className='rounded-xl border border-[#ebe9e4] bg-[#fbfaf7] p-2 text-[#6b6b6b]'>
            <p className='font-semibold text-[#1a1a1a]'>写真ステータス</p>
            <ul className='mt-1 space-y-1'>
              <li>・写真確認中</li>
              <li>・写真確認済み</li>
              <li>・写真を変更してください</li>
            </ul>
            <p className='mt-1'>公開プロフィール画像と、本人確認・プロフィール確認書類は別管理です。</p>
          </section>
        </div>
      </details>
    </article>
  );
}
