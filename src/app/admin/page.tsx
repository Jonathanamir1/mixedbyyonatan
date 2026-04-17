import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import AdminPageContent from './AdminPageContent';

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = 'mixedbyyonatan_session';
const ADMIN_EMAIL = 'jonathanamir1@gmail.com';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const isAdmin = decoded.email?.toLowerCase() === ADMIN_EMAIL;

    if (!isAdmin) {
      redirect('/dashboard');
    }
  } catch {
    redirect('/login');
  }

  return <AdminPageContent />;
}
