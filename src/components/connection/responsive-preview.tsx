'use client';

import { useMemo, useState } from 'react';

type Device = 'pc' | 'tablet' | 'mobile';

const DEVICES: { id: Device; label: string; width: number }[] = [
  { id: 'pc', label: 'PC', width: 1440 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'mobile', label: 'Mobile', width: 390 },
];

const PAGES = [
  { id: 'top', label: 'Top', path: '/' },
  { id: 'events', label: 'Events', path: '/events' },
  { id: 'profile', label: 'Profile', path: '/register/profile' },
  { id: 'complete', label: 'Complete', path: '/register/complete' },
] as const;

export function ResponsivePreviewFrame() {
  const [device, setDevice] = useState<Device>('mobile');
  const [pagePath, setPagePath] = useState<(typeof PAGES)[number]['path']>('/');

  const width = useMemo(() => DEVICES.find((d) => d.id === device)?.width ?? 390, [device]);
  const iframeKey = `${device}-${pagePath}`;

  return (
    <div className='flex min-h-screen flex-col bg-[#eceae6]'>
      <header className='sticky top-0 z-50 border-b border-[#d8d6d1] bg-white/95 px-4 py-3 backdrop-blur'>
        <div className='mx-auto flex max-w-[1600px] flex-col gap-3'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div>
              <p className='text-[10px] font-medium tracking-[0.2em] text-[#9a8b78]'>DEV PREVIEW</p>
              <h1 className='text-sm font-semibold text-[#1a1a1a]'>HANAKAI Connection — レスポンシブ確認</h1>
            </div>
            <p className='text-[11px] text-[#6b6b6b]'>
              幅 {width}px · {pagePath}
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-1.5'>
              <span className='mr-1 text-[11px] font-medium text-[#6b6b6b]'>Device</span>
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  type='button'
                  onClick={() => setDevice(d.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    device === d.id ? 'bg-[#1a1a1a] text-white' : 'border border-[#d8d6d1] bg-white text-[#6b6b6b]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className='flex items-center gap-1.5'>
              <span className='mr-1 text-[11px] font-medium text-[#6b6b6b]'>Page</span>
              {PAGES.map((p) => (
                <button
                  key={p.id}
                  type='button'
                  onClick={() => setPagePath(p.path)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    pagePath === p.path ? 'bg-[#b8956a] text-white' : 'border border-[#d8d6d1] bg-white text-[#6b6b6b]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className='flex flex-1 justify-center overflow-auto p-4 md:p-8'>
        <div
          className='relative shrink-0 overflow-hidden rounded-xl border border-[#d8d6d1] bg-white shadow-[0_8px_32px_rgba(26,26,26,0.12)]'
          style={{ width: `${width}px`, maxWidth: '100%' }}
        >
          <iframe
            key={iframeKey}
            src={pagePath}
            title={`Preview ${pagePath}`}
            className='block w-full border-0'
            style={{ height: 'calc(100vh - 140px)', minHeight: '640px' }}
          />
        </div>
      </div>
    </div>
  );
}
