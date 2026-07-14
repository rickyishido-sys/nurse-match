export function PageSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className='animate-pulse space-y-4' aria-hidden>
      <div className='h-8 w-48 rounded-lg bg-[#ebe9e4]' />
      <div className='h-4 w-full max-w-md rounded bg-[#f3f2ef]' />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className='h-24 rounded-2xl bg-[#f3f2ef]' />
      ))}
    </div>
  );
}
