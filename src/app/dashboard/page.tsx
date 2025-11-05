'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <nav className="bg-black/50 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Mixed By Yonatan</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                Welcome, {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-8">
          <h2 className="text-3xl font-bold text-white mb-6">Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-purple-500/30">
              <h3 className="text-xl font-semibold text-white mb-2">Profile</h3>
              <div className="space-y-2 text-gray-300">
                <p><span className="font-medium">Name:</span> {user?.displayName || 'Not set'}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">User ID:</span> {user?.uid}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30">
              <h3 className="text-xl font-semibold text-white mb-2">Recent Mixes</h3>
              <p className="text-gray-400">No mixes yet. Start creating!</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
              <h3 className="text-xl font-semibold text-white mb-2">Stats</h3>
              <div className="space-y-2 text-gray-300">
                <p><span className="font-medium">Total Mixes:</span> 0</p>
                <p><span className="font-medium">Total Plays:</span> 0</p>
                <p><span className="font-medium">Followers:</span> 0</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold text-white mb-4">Getting Started</h3>
            <div className="bg-black/30 rounded-xl p-6 border border-purple-500/20">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Complete your profile to get started</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Upload your first mix</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Share your mixes with the community</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Connect with other DJs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
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
