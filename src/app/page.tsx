import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
            Mixed By Yonatan
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Your premier DJ mixing platform. Create, share, and discover amazing mixes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link
              href="/signup"
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg hover:shadow-purple-500/50"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-black/50 hover:bg-black/70 text-white font-semibold rounded-lg border border-purple-500/30 transition-colors text-lg backdrop-blur-lg"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
              <div className="text-purple-400 text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Mixes</h3>
              <p className="text-gray-400">Share your best DJ mixes with the world</p>
            </div>

            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
              <div className="text-purple-400 text-4xl mb-4">🎧</div>
              <h3 className="text-xl font-semibold text-white mb-2">Discover Music</h3>
              <p className="text-gray-400">Explore mixes from talented DJs worldwide</p>
            </div>

            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
              <div className="text-purple-400 text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-2">Connect</h3>
              <p className="text-gray-400">Build your network in the DJ community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
