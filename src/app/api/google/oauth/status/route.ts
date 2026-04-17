import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!idToken) {
      return NextResponse.json({ connected: false, reason: 'missing_token' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const isAdmin = decoded.email?.toLowerCase() === 'jonathanamir1@gmail.com';

    if (!isAdmin) {
      return NextResponse.json({ connected: false, reason: 'not_admin' }, { status: 403 });
    }

    const integrationSnap = await adminFirestore.doc('integrations/googleCalendar').get();

    if (!integrationSnap.exists) {
      return NextResponse.json({ connected: false });
    }

    const data = integrationSnap.data();

    return NextResponse.json({
      connected: true,
      connectedAt: data?.connectedAt?.toDate?.()?.toISOString?.() || null,
      scope: data?.scope || null,
    });
  } catch (error) {
    console.error('Google calendar status error:', error);
    return NextResponse.json({ connected: false, reason: 'error' }, { status: 500 });
  }
}
