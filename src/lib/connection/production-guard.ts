import { NextResponse } from 'next/server';

/** Returns 404 in production unless HANAKAI_ALLOW_DEBUG=true */
export function guardDebugApi(): NextResponse | null {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  if (isProd && process.env.HANAKAI_ALLOW_DEBUG !== 'true') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return null;
}
