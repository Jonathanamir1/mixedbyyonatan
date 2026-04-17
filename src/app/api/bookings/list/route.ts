import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

async function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length);
}

export async function GET(request: NextRequest) {
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

    const snapshot = await adminFirestore.collection('bookings').get();
    const bookings = snapshot.docs.map((bookingDoc) => ({
      userId: bookingDoc.id,
      ...bookingDoc.data(),
    }));

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Booking list error:', error);
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
  }
}
