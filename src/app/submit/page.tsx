'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Submit() {
  const [trackName, setTrackName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [trackURL, setTrackURL] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Check if user already has a submission
  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // User already has a submission, redirect to dashboard
          router.push('/dashboard');
        } else {
          setChecking(false);
        }
      } catch (error) {
        console.error('Error checking submission:', error);
        setChecking(false);
      }
    };

    checkExistingSubmission();
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.type.includes('audio')) {
        setError('Please select an audio file (MP3, WAV, etc.)');
        return;
      }
      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (uploadMethod === 'file' && !file) {
      setError('Please select a file to upload');
      return;
    }

    if (uploadMethod === 'url' && !trackURL.trim()) {
      setError('Please provide a track URL');
      return;
    }

    setUploading(true);
    setError('');

    try {
      if (uploadMethod === 'file' && file) {
        // Upload file to Firebase Storage
        const storageRef = ref(storage, `submissions/${user.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            setError(`Upload failed: ${error.message}`);
            setUploading(false);
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              // Save submission data to Firestore
              await addDoc(collection(db, 'submissions'), {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'Unknown',
                trackName,
                message,
                fileURL: downloadURL,
                fileName: file.name,
                fileSize: file.size,
                uploadMethod: 'file',
                createdAt: serverTimestamp(),
                status: 'pending'
              });

              setSubmitted(true);
              setUploading(false);
            } catch (error) {
              console.error('Error saving submission:', error);
              setError('Failed to submit track');
              setUploading(false);
            }
          }
        );
      } else if (uploadMethod === 'url') {
        // URL submission
        await addDoc(collection(db, 'submissions'), {
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Unknown',
          trackName,
          message,
          fileURL: trackURL,
          fileName: 'External URL',
          fileSize: 0,
          uploadMethod: 'url',
          createdAt: serverTimestamp(),
          status: 'pending'
        });

        setSubmitted(true);
        setUploading(false);
      }
    } catch (error) {
      console.error('Error submitting track:', error);
      setError('Failed to submit track');
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-white text-black">
          <Header />

          <section className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="card-flowing p-8 md:p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>

                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase mb-4">
                    Submission Received
                  </h1>

                  <p className="text-base md:text-lg text-gray-600 mb-6">
                    Thank you for submitting your track! We&apos;ll review it and get back to you soon.
                  </p>

                  <Link href="/dashboard" className="btn-primary inline-block">
                    Go to Dashboard
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        </main>
      </ProtectedRoute>
    );
  }

  if (checking) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-white text-black flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg">Loading...</div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white text-black">
        <Header />

        <section className="container-custom py-12 md:py-16">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase mb-3">
                Apply for a Free Mix
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Share your music with us for consideration
              </p>
            </div>

            <div className="card-flowing">
              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6 rounded-lg text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Track Name */}
                <div>
                  <label htmlFor="trackName" className="block text-xs md:text-sm font-medium uppercase tracking-wide mb-2">
                    Track Name *
                  </label>
                  <input
                    type="text"
                    id="trackName"
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-xs md:text-sm font-medium uppercase tracking-wide mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Tell us about your track, your vision, or any specific requests..."
                  />
                </div>

                {/* Upload Method Selector */}
                <div>
                  <label className="block text-xs md:text-sm font-medium uppercase tracking-wide mb-3">
                    Upload Method *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUploadMethod('file')}
                      className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                        uploadMethod === 'file'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 active:bg-gray-50'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('url')}
                      className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                        uploadMethod === 'url'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 active:bg-gray-50'
                      }`}
                    >
                      Provide URL
                    </button>
                  </div>
                  {uploadMethod === 'url' ? (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                      <p className="font-medium mb-1">For URL submissions:</p>
                      <p className="text-gray-700">Please share your track privately with <strong>yonatanamir0@gmail.com</strong> instead of using a public link.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      Upload your audio file directly (MP3, WAV, etc.)
                    </p>
                  )}
                </div>

                {/* File Upload */}
                {uploadMethod === 'file' && (
                  <div>
                    <label htmlFor="file" className="block text-xs md:text-sm font-medium uppercase tracking-wide mb-2">
                      Audio File (MP3, WAV) *
                    </label>
                    <input
                      type="file"
                      id="file"
                      onChange={handleFileChange}
                      accept="audio/*"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      required={uploadMethod === 'file'}
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Max file size: 50MB
                    </p>
                    {file && (
                      <p className="text-sm mt-2 font-medium text-gray-700">
                        Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}

                {/* URL Input */}
                {uploadMethod === 'url' && (
                  <div>
                    <label htmlFor="trackURL" className="block text-xs md:text-sm font-medium uppercase tracking-wide mb-2">
                      Track URL *
                    </label>
                    <input
                      type="url"
                      id="trackURL"
                      value={trackURL}
                      onChange={(e) => setTrackURL(e.target.value)}
                      className="input-field"
                      placeholder="https://drive.google.com/... or https://dropbox.com/..."
                      required={uploadMethod === 'url'}
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Provide a private link shared with <strong>yonatanamir0@gmail.com</strong>
                    </p>
                  </div>
                )}

                {/* Privacy Notice */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
                  <p className="font-medium text-gray-900 mb-2">Privacy & Rights Protection</p>
                  <p>
                    By submitting your track, you confirm that you own all rights to this music or have permission to submit it.
                    Your tracks are handled with complete confidentiality. We will <strong>never use, distribute, sell, or claim ownership</strong> of your music.
                    All submissions are securely stored and only accessed for review purposes.
                  </p>
                </div>

                {/* Upload Progress */}
                {uploading && uploadMethod === 'file' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-black h-2 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploading || (uploadMethod === 'file' && !file) || (uploadMethod === 'url' && !trackURL.trim())}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (uploadMethod === 'file' ? 'Uploading...' : 'Submitting...') : 'Submit Track'}
                </button>
              </form>
            </div>
          </motion.div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
