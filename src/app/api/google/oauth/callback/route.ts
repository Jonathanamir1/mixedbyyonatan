import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-calendar';
import { adminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const stateCookie = request.cookies.get('google_calendar_oauth_state')?.value;

  if (!code) {
    return NextResponse.redirect(new URL('/admin?google=missing_code', request.url));
  }

  if (!state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(new URL('/admin?google=state_mismatch', request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code, request.nextUrl.origin);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL('/admin?google=missing_refresh_token', request.url));
    }

    await adminFirestore.doc('integrations/googleCalendar').set(
      {
        refreshToken: tokens.refresh_token,
        connectedAt: new Date(),
        scope: tokens.scope || null,
      },
      { merge: true }
    );

    const response = NextResponse.redirect(new URL('/admin?google=connected', request.url));
    response.cookies.set({
      name: 'google_calendar_oauth_state',
      value: '',
      path: '/api/google/oauth/callback',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/admin?google=error', request.url));
  }
}
