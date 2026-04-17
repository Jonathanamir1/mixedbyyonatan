'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, deleteDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AdminRoute from '@/components/AdminRoute';
import Header from '@/components/Header';

type SubmissionStatus = 'pending' | 'submitted' | 'accepted' | 'declined' | string;

type Submission = {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  trackName?: string;
  message?: string;
  fileName?: string;
  fileURL?: string;
  uploadMethod?: string;
  status?: SubmissionStatus;
  createdAt?: any;
  reviewedAt?: any;
  reviewedBy?: string;
};

type Booking = {
  userId: string;
  bookingId?: string;
  userEmail?: string;
  userName?: string;
  status?: 'booked' | 'cancelled' | string;
  summary?: string;
  start?: string;
  end?: string;
  timeZone?: string;
  meetLink?: string;
  htmlLink?: string;
  cancelledBy?: string;
  cancelledAt?: any;
  syncedAt?: any;
};

const statusStyles: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
};

function formatDate(value: any) {
  return value?.toDate?.()?.toLocaleString?.() || 'Recently';
}

function AdminPageContent() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleConnectGoogleCalendar = () => {
    window.location.href = '/api/google/oauth/start';
  };

  const loadSubmissions = async () => {
    setLoading(true);
    setError('');

    try {
      const submissionsQuery = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(submissionsQuery);
      setSubmissions(
        snapshot.docs.map((submissionDoc) => ({
          id: submissionDoc.id,
          ...(submissionDoc.data() as Omit<Submission, 'id'>),
        }))
      );
    } catch (err) {
      console.error('Error loading submissions:', err);
      setError('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setBookingLoading(true);
    setError('');

    try {
      if (!user) {
        setBookings([]);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/bookings/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load bookings');
      }

      const payload = (await response.json()) as { bookings?: Booking[] };
      setBookings(payload.bookings || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings.');
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    loadBookings();
  }, [user]);

  const counts = useMemo(() => {
    return submissions.reduce(
      (acc, submission) => {
        const status = submission.status || 'submitted';
        acc[status] = (acc[status] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
  }, [submissions]);

  const handleDecision = async (submissionId: string, status: 'accepted' | 'declined') => {
    setActionId(submissionId);
    setError('');

    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.email || 'admin',
      });

      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                status,
                reviewedBy: user?.email || 'admin',
                reviewedAt: new Date(),
              }
            : submission
        )
      );
    } catch (err) {
      console.error('Error updating submission:', err);
      setError('Failed to update submission.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (submissionId: string) => {
    const confirmed = window.confirm('Delete this submission record? This will let the user submit again.');
    if (!confirmed) {
      return;
    }

    setActionId(submissionId);
    setError('');

    try {
      await deleteDoc(doc(db, 'submissions', submissionId));
      setSubmissions((current) => current.filter((submission) => submission.id !== submissionId));
    } catch (err) {
      console.error('Error deleting submission:', err);
      setError('Failed to delete submission.');
    } finally {
      setActionId(null);
    }
  };

  const handleSyncBookings = async () => {
    if (!user) return;

    setInfo('');
    setError('');
    setActionId('sync-bookings');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/bookings/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync bookings');
      }

      await loadBookings();
      setInfo('Bookings synced successfully.');
    } catch (err) {
      console.error('Error syncing bookings:', err);
      setError('Failed to sync bookings.');
    } finally {
      setActionId(null);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!user) return;

    const confirmed = window.confirm('Cancel this booking and remove it from Google Calendar?');
    if (!confirmed) return;

    setError('');
    setInfo('');
    setActionId(booking.userId);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          userId: booking.userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      await loadBookings();
      setInfo('Booking cancelled.');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            className="mb-8 md:mb-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">
              Admin Dashboard
            </p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight uppercase">
              Review Submissions
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-600 max-w-2xl">
              Accept or decline applications from here. Only you can access this page.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[
              { label: 'Total', value: counts.total || 0 },
              { label: 'Pending', value: counts.pending || 0 },
              { label: 'Submitted', value: counts.submitted || 0 },
              { label: 'Reviewed', value: (counts.accepted || 0) + (counts.declined || 0) },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{item.label}</p>
                <p className="text-3xl font-bold tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm md:text-base font-bold uppercase tracking-wide">Calendar Bookings</h2>
                <p className="text-xs text-gray-500 mt-1">Synced from Google Calendar</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleConnectGoogleCalendar}
                  className="text-xs font-medium uppercase tracking-wide hover:opacity-60 transition-opacity"
                >
                  Connect Calendar
                </button>
                <button
                  type="button"
                  onClick={handleSyncBookings}
                  disabled={actionId === 'sync-bookings'}
                  className="text-xs font-medium uppercase tracking-wide hover:opacity-60 transition-opacity disabled:opacity-50"
                >
                  {actionId === 'sync-bookings' ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>

            {info && (
              <div className="px-5 py-3 bg-green-50 border-b border-green-200 text-green-800 text-sm">
                {info}
              </div>
            )}

            {bookingLoading ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">No bookings yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <div key={booking.userId} className="p-5 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg md:text-xl font-bold tracking-tight">
                            {booking.summary || '1:1 Mix Session'}
                          </h3>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wide ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {booking.status || 'booked'}
                          </span>
                        </div>

                        <div className="grid gap-2 text-sm text-gray-700">
                          <p><span className="font-medium text-black">Client:</span> {booking.userName || booking.userEmail || booking.userId}</p>
                          <p><span className="font-medium text-black">Email:</span> {booking.userEmail || 'Unknown'}</p>
                          <p><span className="font-medium text-black">Start:</span> {formatDate(booking.start)}</p>
                          <p><span className="font-medium text-black">End:</span> {formatDate(booking.end)}</p>
                          {booking.meetLink && (
                            <a
                              href={booking.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium uppercase tracking-wide hover:opacity-60 transition-opacity"
                            >
                              Open Meet
                            </a>
                          )}
                          {booking.htmlLink && (
                            <a
                              href={booking.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium uppercase tracking-wide hover:opacity-60 transition-opacity"
                            >
                              Open Calendar Event
                            </a>
                          )}
                          {booking.cancelledBy && (
                            <p><span className="font-medium text-black">Cancelled by:</span> {booking.cancelledBy}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:min-w-44">
                        <button
                          type="button"
                          disabled={actionId === booking.userId || booking.status === 'cancelled'}
                          onClick={() => handleCancelBooking(booking)}
                          className="w-full rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 text-xs font-medium uppercase tracking-wide hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionId === booking.userId ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold uppercase tracking-wide">Submissions</h2>
              <button
                type="button"
                onClick={loadSubmissions}
                className="text-xs font-medium uppercase tracking-wide hover:opacity-60 transition-opacity"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">No submissions yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {submissions.map((submission) => {
                  const status = submission.status || 'submitted';
                  const canReview = status === 'submitted' || status === 'pending';

                  return (
                    <div key={submission.id} className="p-5 md:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg md:text-xl font-bold tracking-tight">
                              {submission.trackName || 'Untitled Track'}
                            </h3>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wide ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
                              {status}
                            </span>
                          </div>

                          <div className="grid gap-2 text-sm text-gray-700">
                            <p><span className="font-medium text-black">Artist:</span> {submission.userName || 'Unknown'}</p>
                            <p><span className="font-medium text-black">Email:</span> {submission.userEmail || 'Unknown'}</p>
                            <p><span className="font-medium text-black">Submitted:</span> {formatDate(submission.createdAt)}</p>
                            <p><span className="font-medium text-black">Method:</span> {submission.uploadMethod || 'file'}</p>
                            {submission.fileName && <p><span className="font-medium text-black">File:</span> {submission.fileName}</p>}
                            {submission.message && (
                              <p className="max-w-3xl"><span className="font-medium text-black">Message:</span> {submission.message}</p>
                            )}
                            {submission.fileURL && (
                              <a
                                href={submission.fileURL}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium uppercase tracking-wide hover:opacity-60 transition-opacity"
                              >
                                Open Track
                              </a>
                            )}
                            {submission.reviewedBy && (
                              <p><span className="font-medium text-black">Reviewed by:</span> {submission.reviewedBy}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:min-w-44">
                          <button
                            type="button"
                            disabled={!canReview || actionId === submission.id}
                            onClick={() => handleDecision(submission.id, 'accepted')}
                            className="w-full rounded-lg bg-black text-white px-4 py-2.5 text-xs font-medium uppercase tracking-wide hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionId === submission.id ? 'Saving...' : 'Accept'}
                          </button>
                          <button
                            type="button"
                            disabled={!canReview || actionId === submission.id}
                            onClick={() => handleDecision(submission.id, 'declined')}
                            className="w-full rounded-lg bg-white border border-gray-200 text-black px-4 py-2.5 text-xs font-medium uppercase tracking-wide hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            disabled={actionId === submission.id}
                            onClick={() => handleDelete(submission.id)}
                            className="w-full rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 text-xs font-medium uppercase tracking-wide hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminPageContent />
    </AdminRoute>
  );
}
