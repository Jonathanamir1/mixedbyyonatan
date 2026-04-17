import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-calendar';
import { adminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/admin?google=missing_code', request.url));
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

    return NextResponse.redirect(new URL('/admin?google=connected', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/admin?google=error', request.url));
  }
}
