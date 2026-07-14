'use client';

import { useState } from 'react';
import { submitIdentityDocumentAction } from '@/lib/connection/actions';
import {
  getIdentitySubmitButtonLabel,
  getIdentityVerificationDisplayStatus,
  IDENTITY_SUBMIT_BUTTON_LABEL,
  IDENTITY_VERIFICATION_STATUS_DESCRIPTION,
  IDENTITY_VERIFICATION_STATUS_LABEL,
  IDENTITY_VERIFICATION_STATUS_TONE,
} from '@/lib/connection/identity-verification';
import type { ConnectionMember } from '@/lib/connection/types';

const ACCENT = '#1f5d4f';

type IdentityVerificationSectionProps = {
  member: ConnectionMember;
  showUpload?: boolean;
};

export function IdentityVerificationSection({
  member,
  showUpload = true,
}: IdentityVerificationSectionProps) {
  const status = getIdentityVerificationDisplayStatus(member);
  const buttonKind = getIdentitySubmitButtonLabel(status);
  const [fileName, setFileName] = useState('');

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <p className='text-xs font-medium tracking-wide text-[#9a9a9a]'>現在の状態</p>
        <p className={`text-sm font-semibold ${IDENTITY_VERIFICATION_STATUS_TONE[status]}`}>
          {IDENTITY_VERIFICATION_STATUS_LABEL[status]}
        </p>
        <p className='text-xs leading-6 text-[#6b6b6b]'>
          {IDENTITY_VERIFICATION_STATUS_DESCRIPTION[status]}
        </p>
      </div>

      {showUpload && buttonKind ? (
        <form action={submitIdentityDocumentAction} className='space-y-3'>
          <label className='block'>
            <span className='sr-only'>本人確認書類</span>
            <input
              type='file'
              name='identityDocument'
              accept='image/*,.pdf'
              required
              className='w-full rounded-2xl border border-dashed border-[#d8d6d1] bg-white px-4 py-4 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[#edf3ef] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1f5d4f]'
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            />
          </label>
          {fileName ? (
            <p className='text-xs text-[#1f5d4f]'>選択中: {fileName}</p>
          ) : (
            <p className='text-xs text-[#9a9a9a]'>JPG / PNG / PDF · 10MB以下</p>
          )}
          <button
            type='submit'
            className='flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white transition active:scale-[0.99] sm:w-auto sm:px-8'
            style={{ backgroundColor: ACCENT }}
          >
            {IDENTITY_SUBMIT_BUTTON_LABEL[buttonKind]}
          </button>
        </form>
      ) : null}
    </div>
  );
}
