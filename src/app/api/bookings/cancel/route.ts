import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { deleteCalendarEvent, refreshAccessToken } from '@/lib/google-calendar';

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

    const body = await request.json().catch(() => null);
    const bookingId = body?.bookingId as string | undefined;
    const userId = body?.userId as string | undefined;

    if (!bookingId || !userId) {
      return NextResponse.json({ error: 'Missing bookingId or userId' }, { status: 400 });
    }

    const integrationSnap = await adminFirestore.doc('integrations/googleCalendar').get();
    const refreshToken = integrationSnap.data()?.refreshToken as string | undefined;
    if (!refreshToken) {
      return NextResponse.json({ error: 'Google Calendar is not connected' }, { status: 400 });
    }

    const accessToken = await refreshAccessToken(refreshToken);
    await deleteCalendarEvent(accessToken.access_token, bookingId);

    await adminFirestore.doc(`bookings/${userId}`).set(
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: decoded.email || 'admin',
      },
      { merge: true }
    );

    await adminFirestore.doc(`submissions/${userId}`).set(
      {
        bookingStatus: 'none',
        bookingCancelledAt: new Date(),
        bookingCancelledBy: decoded.email || 'admin',
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Booking cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
