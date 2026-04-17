import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || request.nextUrl.origin;
  const state = `connect_${Date.now()}`;
  const redirectUrl = getGoogleAuthUrl(origin, state);
  return NextResponse.redirect(redirectUrl);
}
