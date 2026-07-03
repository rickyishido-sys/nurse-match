export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className='rounded-2xl border border-dashed border-[#e2ddd2] bg-[#fbfaf7] px-6 py-12 text-center'>
      <p className='text-sm font-semibold text-[#1a1a1a]'>{title}</p>
      {description ? <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>{description}</p> : null}
    </div>
  );
}

export function AdminPhase2Note() {
  return (
    <span className='inline-flex items-center rounded-full border border-[#e2ddd2] bg-[#f5f3ee] px-2 py-0.5 text-[10px] font-medium text-[#9a9a9a]'>
      Phase 2予定
    </span>
  );
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatKpiValue(value: number | 'unlinked'): string {
  return value === 'unlinked' ? '未連携' : String(value);
}
