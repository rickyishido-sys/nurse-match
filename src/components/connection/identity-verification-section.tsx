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
import {
  checkIdentityDocumentFileClient,
  IDENTITY_DOCUMENT_REJECT_MESSAGE,
} from '@/lib/connection/identity-document-check';
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFileChange(file: File | null) {
    setFileName(file?.name ?? '');
    setValidationError(null);
    setSelectedFile(file);
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const result = await checkIdentityDocumentFileClient(file);
      if (!result.ok) {
        setValidationError(IDENTITY_DOCUMENT_REJECT_MESSAGE);
        setSelectedFile(null);
      }
    }
  }

  return (
    <div className='space-y-5'>
      <div className='space-y-3 rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-4 py-4'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>安心して人と会えるサービスを目指しています</p>
        <div className='space-y-2 text-xs leading-6 text-[#4a4a4a]'>
          <p>
            HANAKAIでは、安心してイベントへ参加できる環境づくりのため、本人確認書類の提出をお願いしています。
          </p>
          <p>
            提出された本人確認書類は、安全なイベント運営およびトラブル発生時の確認を目的として保管されます。
          </p>
          <p>提出内容は必要に応じて運営が確認を行う場合があります。</p>
          <p>
            本人確認書類以外の画像や、虚偽の内容を提出した場合は、イベント参加停止、イベント開催停止、アカウント停止等の対象となる場合があります。
          </p>
        </div>
      </div>

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
        <form
          action={submitIdentityDocumentAction}
          className='space-y-3'
          onSubmit={() => setSubmitting(true)}
        >
          <label className='block'>
            <span className='sr-only'>本人確認書類</span>
            <input
              type='file'
              name='identityDocument'
              accept='image/*,.pdf'
              required
              className='w-full rounded-2xl border border-dashed border-[#d8d6d1] bg-white px-4 py-4 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[#edf3ef] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1f5d4f]'
              onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {fileName && !validationError ? (
            <p className='text-xs text-[#1f5d4f]'>選択中: {fileName}</p>
          ) : (
            <p className='text-xs text-[#9a9a9a]'>運転免許証・マイナンバーカード・パスポートなど（JPG / PNG / PDF）</p>
          )}
          {validationError ? (
            <p className='rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-6 text-rose-700'>
              {validationError}
            </p>
          ) : null}
          <button
            type='submit'
            disabled={submitting || !selectedFile || !!validationError}
            className='flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-50 sm:w-auto sm:px-8'
            style={{ backgroundColor: ACCENT }}
          >
            {submitting ? '送信中…' : IDENTITY_SUBMIT_BUTTON_LABEL[buttonKind]}
          </button>
        </form>
      ) : null}
    </div>
  );
}
