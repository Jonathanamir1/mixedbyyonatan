import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getGoogleAuthUrl } from '@/lib/google-calendar';

async function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length);
}

export async function POST(request: NextRequest) {
  try {
    const idToken = await getBearerToken(request);
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const isAdmin = decoded.email?.toLowerCase() === 'jonathanamir1@gmail.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const origin = request.nextUrl.origin;
    const state = crypto.randomUUID();
    const redirectUrl = getGoogleAuthUrl(origin, state);

    const response = NextResponse.json({ url: redirectUrl });
    response.cookies.set({
      name: 'google_calendar_oauth_state',
      value: state,
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      path: '/api/google/oauth/callback',
      maxAge: 10 * 60,
    });

    return response;
  } catch (error) {
    console.error('Google OAuth start error:', error);
    return NextResponse.json({ error: 'Failed to start Google OAuth' }, { status: 500 });
  }
}
