import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE_NAME = 'mixedbyyonatan_session';
const DEV_ID_TOKEN_COOKIE_NAME = 'mixedbyyonatan_dev_id_token';
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

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

    try {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
      const response = NextResponse.json({ ok: true, mode: 'session' });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: sessionCookie,
        httpOnly: true,
        secure: request.nextUrl.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      });

      response.cookies.set({
        name: DEV_ID_TOKEN_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      return response;
    } catch (error) {
      const isDevFallback =
        process.env.NODE_ENV !== 'production' &&
        (request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1');

      if (!isDevFallback) {
        throw error;
      }

      const response = NextResponse.json({ ok: true, mode: 'dev-token-fallback' });
      response.cookies.set({
        name: DEV_ID_TOKEN_COOKIE_NAME,
        value: idToken,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      });
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      return response;
    }
  } catch (error) {
    console.error('Session create error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: DEV_ID_TOKEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
