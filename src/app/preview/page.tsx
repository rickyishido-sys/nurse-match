import type { Metadata } from 'next';
import { ResponsivePreviewFrame } from '@/components/connection/responsive-preview';

export const metadata: Metadata = {
  title: 'Preview — HANAKAI Connection (Dev)',
  robots: { index: false, follow: false },
};

/** 開発確認用 — 通常ナビには非表示 */
export default function ConnectionPreviewPage() {
  return <ResponsivePreviewFrame />;
}
