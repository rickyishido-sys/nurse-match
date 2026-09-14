'use client';

import { track, trackOnce } from '@/lib/analytics/track';
import { useEffect, useState } from 'react';
import { submitIdentityDocumentAction } from '@/lib/connection/actions';
import {
  getIdentitySubmitButtonLabel,
  getIdentityStatus,
  IDENTITY_DOCUMENT_AUXILIARY_MESSAGE,
  IDENTITY_SUBMIT_BUTTON_LABEL,
  IDENTITY_SUBMITTING_COPY,
  IDENTITY_STATUS_DESCRIPTION,
  IDENTITY_STATUS_LABEL,
  IDENTITY_STATUS_TONE,
} from '@/lib/connection/identity-verification';
import {
  checkIdentityDocumentFileClient,
  IDENTITY_DOCUMENT_REJECT_MESSAGE,
} from '@/lib/connection/identity-document-check';
import type { ConnectionMember } from '@/lib/connection/types';

const ACCENT = '#1f5d4f';
/** Aggressive client resize so Server Action multipart stays small. */
const MAX_EDGE_PX = 1600;
const COMPRESS_QUALITY = 0.82;
const COMPRESS_IF_OVER_BYTES = 400 * 1024;

type IdentityVerificationSectionProps = {
  member: ConnectionMember;
  showUpload?: boolean;
};

type SubmitPhase = 'idle' | 'preparing' | 'uploading' | 'finalizing';

async function maybeDownscaleIdentityImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = Math.max(bitmap.width, bitmap.height);
    const needsResize = maxEdge > MAX_EDGE_PX || file.size > COMPRESS_IF_OVER_BYTES;
    if (!needsResize && file.type === 'image/jpeg') {
      bitmap.close();
      return file;
    }
    const scale = Math.min(1, MAX_EDGE_PX / maxEdge);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', COMPRESS_QUALITY);
    });
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], 'identity-document.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function IdentityVerificationSection({
  member,
  showUpload = true,
}: IdentityVerificationSectionProps) {
  const status = getIdentityStatus(member);

  useEffect(() => {
    if (status === 'verified') {
      trackOnce(`identity_approved:${member.id}`, 'identity_approved', { member_id: member.id });
    }
  }, [status, member.id]);
  const buttonKind = getIdentitySubmitButtonLabel(status);
  const [fileName, setFileName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle');

  async function handleFileChange(file: File | null) {
    setFileName(file?.name ?? '');
    setValidationError(null);
    setSelectedFile(file);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setValidationError('10MB以下のファイルを選択してください。');
      setSelectedFile(null);
      return;
    }
    if (file.type && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setValidationError('対応形式は JPG / PNG / WebP / PDF です。');
      setSelectedFile(null);
      return;
    }
    if (file.type.startsWith('image/')) {
      const result = await checkIdentityDocumentFileClient(file);
      if (!result.ok) {
        setValidationError(IDENTITY_DOCUMENT_REJECT_MESSAGE);
        setSelectedFile(null);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedFile || validationError) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setSubmitPhase('preparing');
    try {
      const prepared = await maybeDownscaleIdentityImage(selectedFile);
      const body = new FormData();
      body.set('identityDocument', prepared);
      setSubmitPhase('uploading');
      // Paint overlay before the long Server Action starts.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      track('identity_submit');
      await submitIdentityDocumentAction(body);
    } catch (error) {
      const digest =
        typeof error === 'object' && error && 'digest' in error
          ? String((error as { digest?: string }).digest ?? '')
          : '';
      if (digest.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
      console.error('CONNECTION_IDENTITY_CLIENT_SUBMIT_ERROR', {
        message: error instanceof Error ? error.message : String(error),
      });
      setValidationError('送信できませんでした。時間をおいて再度お試しください。');
      setSubmitPhase('idle');
    }
  }

  const submitting = submitPhase !== 'idle';
  const phaseCopy =
    submitPhase === 'preparing'
      ? IDENTITY_SUBMITTING_COPY.preparing
      : submitPhase === 'uploading'
        ? IDENTITY_SUBMITTING_COPY.uploading
        : submitPhase === 'finalizing'
          ? IDENTITY_SUBMITTING_COPY.finalizing
          : null;
  const submitLabel = submitting
    ? (phaseCopy?.title ?? '送信中…')
    : buttonKind
      ? IDENTITY_SUBMIT_BUTTON_LABEL[buttonKind]
      : '';

  return (
    <div className='relative space-y-5'>
      {submitting && phaseCopy ? (
        <div
          className='fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-4 bg-[#faf7f2]/95 px-6'
          role='status'
          aria-live='polite'
          aria-busy='true'
        >
          <p className='text-sm font-semibold tracking-[0.18em] text-[#1f5d4f]'>HANAKAI</p>
          <span className='hk-loading-spinner' aria-hidden />
          <div className='max-w-xs space-y-2 text-center'>
            <p className='text-sm font-semibold text-[#1a1a1a]'>{phaseCopy.title}</p>
            <p className='text-xs leading-6 text-[#6b6b6b]'>{phaseCopy.body}</p>
          </div>
        </div>
      ) : null}

      <div className='space-y-3 rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-4 py-4'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>本人確認について</p>
        <div className='space-y-2 text-xs leading-6 text-[#4a4a4a]'>
          <p>
            安心してイベントに参加・開催できる環境づくりのため、参加前に本人確認をお願いしています。
          </p>
          <p>運営が書類を確認します。他のユーザーには公開されません。</p>
          <p>提出後は「確認中」になり、承認後に本人確認済みとなります。</p>
          <p>
            本人確認書類以外の画像や虚偽の内容を提出した場合は、イベント参加停止・開催停止・アカウント停止等の対象となる場合があります。
          </p>
        </div>
      </div>

      <div className='space-y-1'>
        <p className='text-xs font-medium tracking-wide text-[#9a9a9a]'>現在の状態</p>
        <p className={`text-sm font-semibold ${IDENTITY_STATUS_TONE[status]}`}>
          {IDENTITY_STATUS_LABEL[status]}
        </p>
        <p className='text-xs leading-6 text-[#6b6b6b]'>{IDENTITY_STATUS_DESCRIPTION[status]}</p>
        {showUpload && status !== 'pending' ? (
          <p className='text-xs leading-6 text-[#9a9a9a]'>{IDENTITY_DOCUMENT_AUXILIARY_MESSAGE}</p>
        ) : null}
      </div>

      {status === 'pending' ? (
        <div className='space-y-2 rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          <p className='font-semibold text-[#1a1a1a]'>本人確認書類を受け付けました</p>
          <p>現在、運営にて確認中です。</p>
          <p>確認が完了すると、この画面に結果が表示されます。審査完了まで追加の書類提出はできません。</p>
        </div>
      ) : null}

      {status === 'verified' ? (
        <div className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-xs leading-6 text-[#1f5d4f]'>
          本人確認済みです。プロフィールにも反映されています。
        </div>
      ) : null}

      {showUpload && buttonKind ? (
        <form
          action={submitIdentityDocumentAction}
          className='space-y-3'
          onSubmit={(e) => void handleSubmit(e)}
        >
          <label className='block'>
            <span className='sr-only'>本人確認書類</span>
            <input
              type='file'
              name='identityDocument'
              accept='image/*,.pdf'
              required
              disabled={submitting}
              className='w-full rounded-2xl border border-dashed border-[#d8d6d1] bg-white px-4 py-4 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[#edf3ef] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1f5d4f]'
              onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {fileName && !validationError ? (
            <p className='text-xs text-[#1f5d4f]'>選択中: {fileName}</p>
          ) : (
            <p className='text-xs text-[#9a9a9a]'>
              運転免許証・マイナンバーカード・パスポートなど（JPG / PNG / PDF）
            </p>
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
            {submitLabel}
          </button>
        </form>
      ) : null}
    </div>
  );
}
