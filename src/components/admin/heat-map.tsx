import { getAdminUser, getMeeting } from '@/lib/connection/admin-data';

/**
 * Connection Heat Map — 選定中メンバー同士の同席関係をマトリクス表示。
 * 初対面=緑 / 1回=黄 / 2回以上=赤 / 両者がまた会いたい=深いグリーンで強調。
 */
export function ConnectionHeatMap({ memberIds }: { memberIds: string[] }) {
  if (memberIds.length < 2) {
    return <p className='text-sm text-[#9a9a9a]'>選定メンバーが2名以上になると関係マップが表示されます。</p>;
  }

  const members = memberIds.map((id) => ({ id, name: getAdminUser(id)?.nickname ?? id }));

  return (
    <div className='space-y-3'>
      <div className='overflow-x-auto'>
        <table className='w-full border-separate border-spacing-1 text-[11px]'>
          <thead>
            <tr>
              <th className='sticky left-0 z-10 bg-white' />
              {members.map((m) => (
                <th key={m.id} className='whitespace-nowrap px-2 py-1 text-center font-semibold text-[#4a4a4a]'>
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((rowMember) => (
              <tr key={rowMember.id}>
                <th className='sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1 text-left font-semibold text-[#4a4a4a]'>
                  {rowMember.name}
                </th>
                {members.map((colMember) => {
                  if (rowMember.id === colMember.id) {
                    return (
                      <td
                        key={colMember.id}
                        className='rounded-md bg-[#f5f3ee] px-2 py-2 text-center text-[#c8c4bc]'
                      >
                        —
                      </td>
                    );
                  }
                  const meeting = getMeeting(rowMember.id, colMember.id);
                  const count = meeting?.meetingCount ?? 0;
                  const mutual = Boolean(meeting?.mutualReunionWish);

                  let cls = 'bg-[#eef6f1] text-[#1f5d4f]';
                  let label = '初対面';
                  if (mutual) {
                    cls = 'bg-[#1f5d4f] text-white';
                    label = `${count}回 ♥`;
                  } else if (count >= 2) {
                    cls = 'bg-[#fbeeee] text-[#a23b3b]';
                    label = `${count}回`;
                  } else if (count === 1) {
                    cls = 'bg-[#fbf3df] text-[#8a6a2b]';
                    label = '1回';
                  }

                  return (
                    <td key={colMember.id} className={`rounded-md px-2 py-2 text-center font-medium ${cls}`}>
                      {label}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex flex-wrap gap-3 text-[11px] text-[#6b6b6b]'>
        <Legend className='bg-[#eef6f1] text-[#1f5d4f]' label='初対面' />
        <Legend className='bg-[#fbf3df] text-[#8a6a2b]' label='1回同席' />
        <Legend className='bg-[#fbeeee] text-[#a23b3b]' label='2回以上' />
        <Legend className='bg-[#1f5d4f] text-white' label='両者が再会希望' />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className='inline-flex items-center gap-1.5'>
      <span className={`inline-block h-3 w-5 rounded ${className}`} aria-hidden />
      {label}
    </span>
  );
}
