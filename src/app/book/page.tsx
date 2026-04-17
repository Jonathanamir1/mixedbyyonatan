'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';

type BookingRecord = {
  bookingId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  trackName?: string;
  message?: string;
  status?: 'booked' | 'cancelled' | string;
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  timeZone?: string;
  meetLink?: string;
  htmlLink?: string;
  bookingStatus?: 'booked' | 'cancelled' | string;
  bookingSummary?: string;
  bookingDescription?: string;
  bookingLocation?: string;
  bookingStart?: string;
  bookingEnd?: string;
  bookingTimeZone?: string;
  bookingMeetLink?: string;
  bookingHtmlLink?: string;
};

const BOOKING_URL = 'https://calendar.app.google/MPZaZ13f2o7B7seN9';

function formatDateTime(value?: string, timeZone?: string) {
  if (!value) return 'Recently';
  const date = new Date(value);
  return date.toLocaleString(undefined, { timeZone });
}

function BookingContent() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [syncing, setSyncing] = useState(false);

  const isBooked = booking?.status === 'booked';

  useEffect(() => {
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setAllowed(false);
        return;
      }

      try {
        const submissionSnap = await getDoc(doc(db, 'submissions', user.uid));
        const status = submissionSnap.data()?.status;
        setAllowed(status === 'accepted');
      } catch (error) {
        console.error('Error checking booking access:', error);
        setAllowed(false);
      }
    };

    checkAccess();
  }, [user]);

  useEffect(() => {
    const loadBooking = async () => {
      if (!user || !allowed) {
        return;
      }

      try {
        const submissionSnap = await getDoc(doc(db, 'submissions', user.uid));
        if (!submissionSnap.exists()) {
          setBooking(null);
          return;
        }

        const data = submissionSnap.data() as BookingRecord;
        if (data.bookingStatus === 'booked') {
          setBooking({
            bookingId: data.bookingId,
            userId: data.userId || user.uid,
            userEmail: data.userEmail,
            userName: data.userName,
            status: 'booked',
            summary: data.bookingSummary || data.trackName || '1:1 Mix Session',
            description: data.bookingDescription || data.message || '',
            location: data.bookingLocation || '',
            start: data.bookingStart,
            end: data.bookingEnd,
            timeZone: data.bookingTimeZone,
            meetLink: data.bookingMeetLink,
            htmlLink: data.bookingHtmlLink,
            bookingStatus: data.bookingStatus,
          });
          return;
        }

        setBooking(null);
      } catch (error) {
        console.error('Error loading booking:', error);
      }
    };

    loadBooking();
  }, [user, allowed]);

  useEffect(() => {
    const syncBooking = async () => {
      if (!user || !allowed || booking?.status === 'booked') {
        return;
      }

      try {
        setSyncing(true);
        const token = await user.getIdToken();
        const response = await fetch('/api/bookings/sync', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { booking?: BookingRecord | null };
        if (payload.booking) {
          setBooking(payload.booking);
        }
      } catch (error) {
        console.error('Error syncing booking:', error);
      } finally {
        setSyncing(false);
      }
    };

    syncBooking();

    const interval = window.setInterval(syncBooking, 15000);
    return () => window.clearInterval(interval);
  }, [user, allowed, booking?.status]);

  const details = useMemo(() => {
    if (!booking) {
      return null;
    }

    return {
      title: booking.summary || '1:1 Mix Session',
      subtitle: booking.description || 'Your mix session booking has been confirmed.',
      when: formatDateTime(booking.start, booking.timeZone),
      until: formatDateTime(booking.end, booking.timeZone),
    };
  }, [booking]);

  if (allowed === null) {
    return (
      <div className="h-[100dvh] bg-white text-black flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-4 min-h-0 overflow-hidden">
          <div className="text-sm text-gray-500">Loading booking page...</div>
        </main>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="h-[100dvh] bg-white text-black flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-4 min-h-0 overflow-hidden">
          <motion.div
            className="w-full max-w-2xl text-center bg-white border border-gray-100 rounded-2xl shadow-md p-5 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">
              Booking
            </p>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight uppercase mb-3">
              Booking not available yet
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              You&apos;ll get access to the 1:1 booking page after your submission is accepted.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-black text-white px-5 py-3 rounded-lg text-xs font-medium uppercase tracking-wide hover:bg-gray-800 transition-all"
            >
              Back to Dashboard
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  if (isBooked && details) {
    return (
      <div className="h-[100dvh] bg-white text-black flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 px-3 py-3 md:px-4 md:py-4 flex items-center justify-center min-h-0 overflow-hidden">
          <div className="w-full max-w-3xl min-h-0">
            <motion.div
              className="bg-white border border-gray-100 rounded-2xl shadow-md p-4 md:p-8 max-h-full overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-1.5">
                    Booking Confirmed
                  </p>
                  <h1 className="text-xl md:text-3xl font-bold tracking-tight uppercase">
                    {details.title}
                  </h1>
                </div>
                <span className="inline-flex w-fit px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-xs font-medium uppercase tracking-wide">
                  Booked
                </span>
              </div>

              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-5">
                {details.subtitle}
              </p>

              <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 p-3.5 md:p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                    When
                  </p>
                  <p className="text-sm md:text-base font-semibold">{details.when}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-3.5 md:p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                    Ends
                  </p>
                  <p className="text-sm md:text-base font-semibold">{details.until}</p>
                </div>
                {booking.meetLink && (
                  <div className="rounded-xl border border-gray-100 p-3.5 md:p-4 md:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                      Google Meet
                    </p>
                    <a
                      href={booking.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm md:text-base font-semibold underline underline-offset-4"
                    >
                      Open meeting link
                    </a>
                  </div>
                )}
                {booking.htmlLink && (
                  <div className="rounded-xl border border-gray-100 p-3.5 md:p-4 md:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                      Calendar Event
                    </p>
                    <a
                      href={booking.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm md:text-base font-semibold underline underline-offset-4"
                    >
                      View in Google Calendar
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-[13px] text-gray-700">
                Your booking is now tied to your account. If it changes, this page will update after the calendar sync runs.
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-white text-black flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 px-2 py-1.5 md:px-4 md:py-2 overflow-hidden min-h-0">
        <div className="mx-auto flex h-[calc(100dvh-5rem)] min-h-0 w-full max-w-6xl flex-col gap-1">
          <motion.div
            className="shrink-0 text-center leading-tight"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-sm sm:text-base md:text-2xl font-bold tracking-tight uppercase">
              Book Your Mix Session
            </h1>
            <p className="hidden md:block mt-0.5 text-xs text-gray-600 max-w-2xl mx-auto">
              Choose a time and Google Calendar will handle the scheduling and availability.
            </p>
          </motion.div>

          <div className="flex flex-1 min-h-0 flex-col gap-1 lg:grid lg:grid-cols-[1.5fr_0.5fr] items-stretch">
            <motion.section
              className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden flex-1 min-h-0 h-full lg:min-h-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <iframe
                src={BOOKING_URL}
                title="Google Calendar appointment scheduling"
                className="w-full h-full bg-white"
                style={{ border: 0 }}
                frameBorder="0"
              />
            </motion.section>

            <motion.aside
              className="hidden lg:flex flex-col gap-1.5 lg:h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="bg-black text-white rounded-2xl p-2.5 shadow-md">
                <p className="text-[9px] uppercase tracking-[0.3em] opacity-70 mb-1">
                  Session
                </p>
                <h2 className="text-xs md:text-sm font-bold tracking-tight uppercase mb-1">
                  What happens next
                </h2>
                <ul className="space-y-1 text-[10px] md:text-[11px] text-white/80">
                  <li>• Pick an open time</li>
                  <li>• Google blocks it automatically once booked</li>
                  <li>• You receive confirmation from Google Calendar</li>
                  <li>• We use the session to plan the mix</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold uppercase">
                    GC
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[10px] font-bold uppercase tracking-wide">
                      Booking page
                    </h3>
                    <p className="text-[9px] md:text-[10px] text-gray-600 leading-snug">
                      Opens your Google Calendar appointment schedule.
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BookPage() {
  return (
    <ProtectedRoute>
      <BookingContent />
    </ProtectedRoute>
  );
}
