import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { refreshAccessToken, listPrimaryCalendarEvents, extractMeetLink, extractEventTiming, GoogleEvent } from '@/lib/google-calendar';

async function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length);
}

function getAttendeeEmails(event: GoogleEvent) {
  return (event.attendees || [])
    .map((attendee) => attendee.email?.toLowerCase())
    .filter((email): email is string => Boolean(email));
}

export async function POST(request: NextRequest) {
  try {
    const idToken = await getBearerToken(request);
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const isAdmin = decoded.email?.toLowerCase() === 'jonathanamir1@gmail.com';

    const integrationSnap = await adminFirestore.doc('integrations/googleCalendar').get();
    const refreshToken = integrationSnap.data()?.refreshToken as string | undefined;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Google Calendar is not connected' }, { status: 400 });
    }

    const accessToken = await refreshAccessToken(refreshToken);
    const timeMin = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const events = await listPrimaryCalendarEvents(accessToken.access_token, timeMin);
    let currentUserBooking: Record<string, unknown> | null = null;

    const submissionsSnap = await adminFirestore.collection('submissions').get();
    const submissionsByEmail = new Map<string, { id: string; data: FirebaseFirestore.DocumentData }>();
    submissionsSnap.forEach((doc) => {
      const data = doc.data();
      const email = (data.userEmail || '').toLowerCase();
      if (email) {
        submissionsByEmail.set(email, { id: doc.id, data });
      }
    });

    for (const event of events) {
      if (event.status === 'cancelled') {
        continue;
      }

      const attendeeEmails = getAttendeeEmails(event);
      const matchedSubmission =
        attendeeEmails.map((email) => submissionsByEmail.get(email)).find(Boolean) || null;

      if (!matchedSubmission) {
        continue;
      }

      const { start, end, timeZone } = extractEventTiming(event);
      const meetLink = extractMeetLink(event);
      await adminFirestore.doc(`bookings/${matchedSubmission.id}`).set(
        {
          bookingId: event.id,
          userId: matchedSubmission.id,
          userEmail: matchedSubmission.data.userEmail || null,
          userName: matchedSubmission.data.userName || null,
          status: 'booked',
          summary: event.summary || '1:1 Mix Session',
          description: event.description || '',
          location: event.location || '',
          start,
          end,
          timeZone,
          meetLink,
          htmlLink: event.htmlLink || '',
          googleEvent: event,
          syncedAt: new Date(),
          updatedBy: isAdmin ? decoded.email : 'sync',
        },
        { merge: true }
      );

      await adminFirestore.doc(`submissions/${matchedSubmission.id}`).set(
        {
          bookingStatus: 'booked',
          bookingId: event.id,
          bookingSummary: event.summary || '1:1 Mix Session',
          bookingDescription: event.description || '',
          bookingLocation: event.location || '',
          bookingStart: start,
          bookingEnd: end,
          bookingTimeZone: timeZone,
          bookingMeetLink: meetLink,
          bookingHtmlLink: event.htmlLink || '',
          bookingSyncedAt: new Date(),
        },
        { merge: true }
      );

      if (matchedSubmission.id === decoded.uid) {
        currentUserBooking = {
          bookingId: event.id,
          userId: matchedSubmission.id,
          userEmail: (matchedSubmission.data.userEmail as string | null | undefined) || null,
          userName: (matchedSubmission.data.userName as string | null | undefined) || null,
          status: 'booked',
          summary: event.summary || '1:1 Mix Session',
          description: event.description || '',
          location: event.location || '',
          start,
          end,
          timeZone,
          meetLink,
          htmlLink: event.htmlLink || '',
        };
      }
    }

    const bookingsSnap = await adminFirestore.collection('bookings').get();
    const staleUpdates: Promise<unknown>[] = [];

    bookingsSnap.forEach((doc) => {
      const data = doc.data();
      if (!data.bookingId) {
        return;
      }

      const matchingEvent = events.find((event) => event.id === data.bookingId);
      if (!matchingEvent && data.status === 'booked') {
        staleUpdates.push(
          doc.ref.set({
            ...data,
            status: 'cancelled',
            cancelledAt: new Date(),
            syncedAt: new Date(),
          }, { merge: true })
        );

        staleUpdates.push(
          adminFirestore.doc(`submissions/${doc.id}`).set(
            {
              bookingStatus: 'none',
              bookingCancelledAt: new Date(),
            },
            { merge: true }
          )
        );
      }
    });

    await Promise.all(staleUpdates);

    return NextResponse.json({
      ok: true,
      syncedEvents: events.length,
      booking: currentUserBooking,
    });
  } catch (error) {
    console.error('Booking sync error:', error);
    return NextResponse.json({ error: 'Failed to sync bookings' }, { status: 500 });
  }
}
