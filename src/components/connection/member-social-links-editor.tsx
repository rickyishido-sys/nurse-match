'use client';

import { useState } from 'react';
import {
  SOCIAL_LINK_PLATFORMS,
  type SocialLinkPlatform,
} from '@/lib/connection/bloom-profile-options';
import type { MemberSocialLink } from '@/lib/connection/types';

const fieldClass =
  'w-full rounded-2xl border border-[#ebe9e4] bg-[#faf9f6] px-4 py-3 text-sm text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-1 focus:ring-[#1f5d4f]/20';

type SocialLinkDraft = {
  url: string;
  isVisibleOnProfile: boolean;
};

function initialDrafts(links: MemberSocialLink[]): Record<SocialLinkPlatform, SocialLinkDraft> {
  const map = {} as Record<SocialLinkPlatform, SocialLinkDraft>;
  for (const { platform } of SOCIAL_LINK_PLATFORMS) {
    const existing = links.find((l) => l.platform === platform);
    map[platform] = {
      url: existing?.url ?? '',
      isVisibleOnProfile: existing?.isVisibleOnProfile ?? false,
    };
  }
  return map;
}

export function MemberSocialLinksEditor({ initialLinks }: { initialLinks: MemberSocialLink[] }) {
  const [drafts, setDrafts] = useState(() => initialDrafts(initialLinks));

  function updateUrl(platform: SocialLinkPlatform, url: string) {
    setDrafts((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], url },
    }));
  }

  function toggleVisible(platform: SocialLinkPlatform) {
    setDrafts((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], isVisibleOnProfile: !prev[platform].isVisibleOnProfile },
    }));
  }

  return (
    <div className='space-y-4'>
      <p className='text-xs leading-6 text-[#6b6b6b]'>
        SNS URLは保存のみ行います。公開プロフィールに表示するものだけ「表示する」をONにしてください。初期値は非公開です。
      </p>
      {SOCIAL_LINK_PLATFORMS.map(({ platform, label, placeholder }) => {
        const draft = drafts[platform];
        const hasUrl = draft.url.trim().length > 0;
        return (
          <div key={platform} className='rounded-2xl border border-[#f1efe9] bg-[#fbf9f5] p-4'>
            <label className='mb-2 block text-xs font-medium tracking-wide text-[#9a9a9a]'>{label}</label>
            <input
              type='url'
              name={`socialLink_${platform}`}
              value={draft.url}
              onChange={(e) => updateUrl(platform, e.target.value)}
              placeholder={placeholder}
              autoComplete='off'
              className={fieldClass}
            />
            <input
              type='hidden'
              name={`socialVisible_${platform}`}
              value={hasUrl && draft.isVisibleOnProfile ? '1' : '0'}
            />
            {hasUrl ? (
              <label className='mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#ebe9e4] bg-white px-3 py-2.5'>
                <span className='text-xs text-[#4a4a4a]'>プロフィールに表示する</span>
                <button
                  type='button'
                  role='switch'
                  aria-checked={draft.isVisibleOnProfile}
                  onClick={() => toggleVisible(platform)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    draft.isVisibleOnProfile ? 'bg-[#1f5d4f]' : 'bg-[#d8d6d1]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      draft.isVisibleOnProfile ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
            ) : (
              <p className='mt-2 text-[11px] text-[#b0b0b0]'>URL未入力のため非公開</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
