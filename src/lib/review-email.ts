import { SITE_URL } from '@/lib/config';

const LOGIN_URL = `${SITE_URL}/login`;
const BRAND = 'HANAKAI Connection';

function buildApprovedBody() {
  return [
    `${BRAND}へのご登録ありがとうございます。`,
    '',
    'プロフィール確認が完了し、',
    'サービスをご利用いただけるようになりました。',
    '',
    'プロフィールを充実させることで、',
    'よりあなたに合った体験や出会いを見つけやすくなります。',
    '',
    `ログイン: ${LOGIN_URL}`,
  ].join('\n');
}

function buildRejectedBody(reason: string) {
  return [
    `${BRAND}へのご登録ありがとうございます。`,
    '',
    '確認の結果、',
    '現在の登録内容では審査を完了できませんでした。',
    '',
    `理由: ${reason}`,
    '',
    'お手数ですが、',
    '内容をご確認のうえ再提出をお願いいたします。',
    '',
    `ログイン: ${LOGIN_URL}`,
  ].join('\n');
}

// NOTE:
// This project currently does not have an outbound email provider wired for
// transactional review emails. We keep the function interface here and log
// payloads server-side so provider integration can be added without changing call sites.
export async function sendReviewApprovedEmail(email: string) {
  console.log('REVIEW_APPROVED_EMAIL', {
    to: email,
    subject: '【HANAKAI Connection】参加審査が完了しました',
    body: buildApprovedBody(),
  });
}

export async function sendReviewRejectedEmail(email: string, reason: string) {
  console.log('REVIEW_REJECTED_EMAIL', {
    to: email,
    subject: '【HANAKAI Connection】登録内容確認のお願い',
    body: buildRejectedBody(reason),
  });
}

