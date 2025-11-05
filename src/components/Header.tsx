'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <motion.header
      className="sticky top-0 z-50 bg-white shadow-md"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20 md:h-20">
          {/* Logo */}
          <Link href="/" className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight uppercase flex-shrink-0 py-2">
            <span className="hidden sm:inline">Mixed by Yonatan Amir</span>
            <span className="sm:hidden">YA Mixing</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium tracking-wide uppercase hover:opacity-60 transition-opacity">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium tracking-wide uppercase hover:opacity-60 transition-opacity"
                >
                  Logout
                </button>
                <Link href="/submit" className="bg-black text-white px-6 py-2 font-medium tracking-wide uppercase text-sm hover:bg-gray-800 transition-all duration-300 rounded-lg shadow-md hover:shadow-lg">
                  Apply for Free Mix
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium tracking-wide uppercase hover:opacity-60 transition-opacity">
                  Login
                </Link>
                <Link href="/login" className="bg-black text-white px-6 py-2 font-medium tracking-wide uppercase text-sm hover:bg-gray-800 transition-all duration-300 rounded-lg shadow-md hover:shadow-lg">
                  Apply for Free Mix
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button - Larger tap target */}
          <button
            className="md:hidden p-3 -mr-2 touch-manipulation active:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.nav
            className="md:hidden py-6 border-t border-gray-100"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-lg font-medium tracking-wide uppercase hover:opacity-60 transition-opacity py-3 active:bg-gray-50 rounded-lg px-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-lg font-medium tracking-wide uppercase hover:opacity-60 transition-opacity text-left py-3 active:bg-gray-50 rounded-lg px-2"
                  >
                    Logout
                  </button>
                  <Link
                    href="/submit"
                    className="btn-primary w-full text-center mt-2 text-base"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Submit Track
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-lg font-medium tracking-wide uppercase hover:opacity-60 transition-opacity py-3 active:bg-gray-50 rounded-lg px-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/login"
                    className="btn-primary w-full text-center mt-2 text-base"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Apply for Free Mix
                  </Link>
                </>
              )}
            </div>
          </motion.nav>
        )}
      </div>
    </motion.header>
  );
}
