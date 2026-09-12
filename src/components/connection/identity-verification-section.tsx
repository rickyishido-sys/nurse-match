'use client';

import { useState } from 'react';
import { submitIdentityDocumentAction } from '@/lib/connection/actions';
import {
  getIdentitySubmitButtonLabel,
  getIdentityStatus,
  IDENTITY_DOCUMENT_AUXILIARY_MESSAGE,
  IDENTITY_SUBMIT_BUTTON_LABEL,
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
const MAX_EDGE_PX = 2400;
const COMPRESS_QUALITY = 0.9;
const COMPRESS_IF_OVER_BYTES = 1.5 * 1024 * 1024;

type IdentityVerificationSectionProps = {
  member: ConnectionMember;
  showUpload?: boolean;
};

type SubmitPhase = 'idle' | 'preparing' | 'uploading';

async function maybeDownscaleIdentityImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= COMPRESS_IF_OVER_BYTES) {
    return file;
  }
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = Math.max(bitmap.width, bitmap.height);
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
      setValidationError('送信に失敗しました。時間をおいて再度お試しください。');
      setSubmitPhase('idle');
    }
  }

  const submitting = submitPhase !== 'idle';
  const submitLabel =
    submitPhase === 'preparing'
      ? '書類を準備しています…'
      : submitPhase === 'uploading'
        ? '送信中…（アップロードと審査登録）'
        : buttonKind
          ? IDENTITY_SUBMIT_BUTTON_LABEL[buttonKind]
          : '';

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
        <p className={`text-sm font-semibold ${IDENTITY_STATUS_TONE[status]}`}>
          {IDENTITY_STATUS_LABEL[status]}
        </p>
        <p className='text-xs leading-6 text-[#6b6b6b]'>
          {IDENTITY_STATUS_DESCRIPTION[status]}
        </p>
        {showUpload && status !== 'pending' ? (
          <p className='text-xs leading-6 text-[#9a9a9a]'>{IDENTITY_DOCUMENT_AUXILIARY_MESSAGE}</p>
        ) : null}
      </div>

      {status === 'pending' ? (
        <div className='rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          審査が完了するまで、追加の書類提出はできません。
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
            <p className='text-xs text-[#9a9a9a]'>運転免許証・マイナンバーカード・パスポートなど（JPG / PNG / PDF）</p>
          )}
          {validationError ? (
            <p className='rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-6 text-rose-700'>
              {validationError}
            </p>
          ) : null}
          {submitting ? (
            <p className='text-xs leading-6 text-[#6b6b6b]'>
              書類の確認・安全な保管・審査登録を行っています。完了までこの画面のままお待ちください。
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
