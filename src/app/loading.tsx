export default function HomeLoading() {
  return (
    <div className='mx-auto flex min-h-[50vh] max-w-[390px] items-center justify-center px-5 md:max-w-[768px] lg:max-w-[1200px]'>
      <div className='space-y-3 text-center'>
        <div className='mx-auto h-8 w-8 animate-pulse rounded-full bg-[#ebe9e4]' aria-hidden />
        <p className='text-sm text-[#9a9a9a]'>読み込み中…</p>
      </div>
    </div>
  );
}
