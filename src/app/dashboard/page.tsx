'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      <main className="container-custom py-12 md:py-16">
        <div className="mb-10 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase mb-3">
            Dashboard
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Welcome back, {user?.displayName || user?.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="card-flowing">
            <h3 className="text-lg md:text-xl font-semibold mb-4 uppercase tracking-wide">Profile</h3>
            <div className="space-y-2 text-sm md:text-base text-gray-600">
              <p><span className="font-medium text-black">Name:</span> {user?.displayName || 'Not set'}</p>
              <p><span className="font-medium text-black">Email:</span> {user?.email}</p>
              <p className="text-xs text-gray-400 pt-2">User ID: {user?.uid?.slice(0, 12)}...</p>
            </div>
          </div>

          <div className="card-flowing">
            <h3 className="text-lg md:text-xl font-semibold mb-4 uppercase tracking-wide">Recent Mixes</h3>
            <p className="text-sm md:text-base text-gray-500">No mixes yet. Start creating!</p>
          </div>

          <div className="card-flowing md:col-span-2 lg:col-span-1">
            <h3 className="text-lg md:text-xl font-semibold mb-4 uppercase tracking-wide">Stats</h3>
            <div className="space-y-2 text-sm md:text-base text-gray-600">
              <p><span className="font-medium text-black">Total Mixes:</span> 0</p>
              <p><span className="font-medium text-black">Total Plays:</span> 0</p>
              <p><span className="font-medium text-black">Followers:</span> 0</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="card-flowing">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 uppercase tracking-tight">Getting Started</h2>
          <ul className="space-y-4 text-sm md:text-base">
            <li className="flex items-start">
              <span className="text-black font-bold mr-3 mt-0.5">1.</span>
              <span className="text-gray-700">Complete your profile to get started</span>
            </li>
            <li className="flex items-start">
              <span className="text-black font-bold mr-3 mt-0.5">2.</span>
              <span className="text-gray-700">Upload your first mix</span>
            </li>
            <li className="flex items-start">
              <span className="text-black font-bold mr-3 mt-0.5">3.</span>
              <span className="text-gray-700">Share your mixes with the community</span>
            </li>
            <li className="flex items-start">
              <span className="text-black font-bold mr-3 mt-0.5">4.</span>
              <span className="text-gray-700">Connect with other DJs</span>
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
