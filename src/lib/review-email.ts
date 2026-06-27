import { SITE_URL } from '@/lib/config';

const LOGIN_URL = `${SITE_URL}/login`;

function buildApprovedBody() {
  return [
    'ナースマッチへのご登録ありがとうございます。',
    '',
    '審査が完了し、',
    'サービスをご利用いただけるようになりました。',
    '',
    'マイページからプロフィールを充実させることで、',
    'よりあなたに合ったお相手と出会いやすくなります。',
    '',
    `ログイン: ${LOGIN_URL}`,
  ].join('\n');
}

function buildRejectedBody(reason: string) {
  return [
    'ナースマッチへのご登録ありがとうございます。',
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
    subject: '【ナースマッチ】審査が完了しました',
    body: buildApprovedBody(),
  });
}

export async function sendReviewRejectedEmail(email: string, reason: string) {
  console.log('REVIEW_REJECTED_EMAIL', {
    to: email,
    subject: '【ナースマッチ】登録内容確認のお願い',
    body: buildRejectedBody(reason),
  });
}

