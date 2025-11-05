'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Submit() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard - all submission functionality is now there
    router.push('/dashboard');
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-lg">Redirecting to dashboard...</div>
      </div>
    </ProtectedRoute>
  );
}
