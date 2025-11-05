'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  // Submission form states
  const [trackName, setTrackName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [trackURL, setTrackURL] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // Submission status states
  const [hasSubmission, setHasSubmission] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing submission
  useEffect(() => {
    const checkSubmission = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setHasSubmission(true);
          setSubmissionData(querySnapshot.docs[0].data());
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking submission:', error);
        setLoading(false);
      }
    };

    checkSubmission();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.includes('audio')) {
        setError('Please select an audio file (MP3, WAV, etc.)');
        return;
      }
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
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              const docRef = await addDoc(collection(db, 'submissions'), {
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

              setHasSubmission(true);
              setSubmissionData({
                trackName,
                message,
                fileName: file.name,
                status: 'pending',
                createdAt: new Date()
              });
              setUploading(false);
            } catch (error) {
              console.error('Error saving submission:', error);
              setError('Failed to submit track');
              setUploading(false);
            }
          }
        );
      } else if (uploadMethod === 'url') {
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

        setHasSubmission(true);
        setSubmissionData({
          trackName,
          message,
          fileName: 'External URL',
          status: 'pending',
          createdAt: new Date()
        });
        setUploading(false);
      }
    } catch (error) {
      console.error('Error submitting track:', error);
      setError('Failed to submit track');
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // View: User has already submitted
  if (hasSubmission) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header />

        <main className="container-custom py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase mb-3">
                  Dashboard
                </h1>
                <p className="text-base md:text-lg text-gray-600">
                  Welcome back, {user?.displayName || user?.email}
                </p>
              </div>

              {/* Submission Status Card */}
              <div className="card-flowing mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">
                      Your Submission
                    </h2>
                    <p className="text-sm text-gray-600">
                      Track submitted successfully
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-lg uppercase tracking-wide">
                    {submissionData?.status || 'Pending'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Track Name</p>
                    <p className="text-lg font-semibold mt-1">{submissionData?.trackName}</p>
                  </div>

                  {submissionData?.message && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Message</p>
                      <p className="text-base text-gray-700 mt-1">{submissionData.message}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Submitted</p>
                    <p className="text-base text-gray-700 mt-1">
                      {submissionData?.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">What happens next?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-0.5">•</span>
                    <span>We&apos;ll review your submission carefully</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-0.5">•</span>
                    <span>If selected, we&apos;ll reach out via email to schedule a call</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-0.5">•</span>
                    <span>Check back here for updates on your submission status</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // View: User hasn't submitted yet - Show submission form
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      <main className="container-custom py-12 md:py-16">
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
                    <p className="text-gray-700">Please share your track privately with <strong>yonatanamir0@gmail.com</strong></p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    Upload your audio file directly (MP3, WAV, etc.)
                  </p>
                )}
              </div>

              {uploadMethod === 'file' && (
                <div>
                  <label htmlFor="file" className="block text-xs md:text-sm font-medium uppercase tracking-wide mb-2">
                    Audio File *
                  </label>
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    accept="audio/*"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    required={uploadMethod === 'file'}
                  />
                  <p className="text-xs text-gray-600 mt-2">Max file size: 50MB</p>
                  {file && (
                    <p className="text-sm mt-2 font-medium">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

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

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
                <p className="font-medium text-gray-900 mb-2">Privacy & Rights Protection</p>
                <p>
                  By submitting, you confirm you own all rights to this music. Your tracks are handled with complete confidentiality.
                  We will <strong>never use, distribute, or claim ownership</strong> of your music.
                </p>
              </div>

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
