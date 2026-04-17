'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';

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
  const [submissionStatus, setSubmissionStatus] = useState<'none' | 'pending' | 'submitted'>('none');
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  // Check for existing submission
  useEffect(() => {
    const checkSubmission = async () => {
      if (!user) {
        setCheckingSubmission(false);
        return;
      }

      try {
        const submissionRef = doc(db, 'submissions', user.uid);
        const submissionSnap = await getDoc(submissionRef);

        if (submissionSnap.exists()) {
          const data = submissionSnap.data();
          const status = data.status === 'pending' ? 'pending' : 'submitted';
          setSubmissionStatus(status);
          setSubmissionData(data);
        }
      } catch (error) {
        console.error('Error checking submission:', error);
      } finally {
        setCheckingSubmission(false);
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
    if (!user || checkingSubmission) return;

    if (submissionStatus !== 'none') {
      setError('You already have a submission on file.');
      return;
    }

    try {
      const existingSubmission = await getDoc(doc(db, 'submissions', user.uid));
      if (existingSubmission.exists()) {
        const data = existingSubmission.data();
        setSubmissionStatus(data.status === 'pending' ? 'pending' : 'submitted');
        setSubmissionData(data);
        setError('You already have a submission on file.');
        return;
      }
    } catch (error) {
      console.error('Error re-checking submission before submit:', error);
    }

    if (uploadMethod === 'file' && !file) {
      setError('Please select a file to upload');
      return;
    }

    if (uploadMethod === 'url' && !trackURL.trim()) {
      setError('Please provide a track URL');
      return;
    }

    if (uploadMethod === 'file' && typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('You are offline. Reconnect to upload a file.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      if (uploadMethod === 'file' && file) {
        await setDoc(doc(db, 'submissions', user.uid), {
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Unknown',
          trackName,
          message,
          fileName: file.name,
          fileSize: file.size,
          uploadMethod: 'file',
          createdAt: serverTimestamp(),
          status: 'pending'
        });

        setSubmissionStatus('pending');
        setSubmissionData({
          trackName,
          message,
          fileName: file.name,
          status: 'pending',
          createdAt: new Date(),
        });

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

              await setDoc(doc(db, 'submissions', user.uid), {
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
                status: 'submitted'
              });

              setSubmissionStatus('submitted');
              setSubmissionData({
                trackName,
                message,
                fileName: file.name,
                status: 'submitted',
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
        await setDoc(doc(db, 'submissions', user.uid), {
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
          status: 'submitted'
        });

        setSubmissionStatus('submitted');
        setSubmissionData({
          trackName,
          message,
          fileName: 'External URL',
          status: 'submitted',
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

  const isPendingSubmission = submissionStatus === 'pending';
  const isSubmitted = submissionStatus === 'submitted';

  // View: User has already submitted
  if (isSubmitted || isPendingSubmission) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6 text-center">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase mb-2">
                  Dashboard
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Welcome back, {user?.displayName || user?.email}
                </p>
              </div>

              {/* Submission Status Card */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-md mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight mb-1">
                      Your Submission
                    </h2>
                    <p className="text-xs text-gray-600">
                      {isPendingSubmission ? 'Upload in progress' : 'Track submitted successfully'}
                    </p>
                  </div>
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-lg uppercase tracking-wide ${isPendingSubmission ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {isPendingSubmission ? 'Pending' : 'Submitted'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Track Name</p>
                    <p className="text-base font-semibold mt-0.5">{submissionData?.trackName}</p>
                  </div>

                  {submissionData?.message && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</p>
                      <p className="text-sm text-gray-700 mt-0.5">{submissionData.message}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {submissionData?.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-sm mb-2">What happens next?</h3>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-0.5">•</span>
                    <span>We&apos;ll review your submission carefully</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-0.5">•</span>
                    <span>If selected, we&apos;ll reach out via email</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-0.5">•</span>
                    <span>{isPendingSubmission ? 'Please wait for the upload to finish before submitting again' : 'Check back here for status updates'}</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // View: User hasn't submitted yet - Show submission form
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase mb-2">
              Apply for a Free Mix
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Share your music with us for consideration
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-md">
            {checkingSubmission && (
              <div className="mb-4 text-center text-xs text-gray-500">
                Checking your submission status...
              </div>
            )}

            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 mb-4 rounded-lg text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="trackName" className="block text-xs font-medium uppercase tracking-wide mb-1.5">
                  Track Name *
                </label>
                <input
                  type="text"
                  id="trackName"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-medium uppercase tracking-wide mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all resize-none"
                  placeholder="Tell us about your track..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2">
                  Upload Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`px-3 py-2.5 rounded-lg border-2 font-medium text-xs transition-all ${
                      uploadMethod === 'file'
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('url')}
                    className={`px-3 py-2.5 rounded-lg border-2 font-medium text-xs transition-all ${
                      uploadMethod === 'url'
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Provide URL
                  </button>
                </div>
              </div>

              {uploadMethod === 'file' && (
                <div>
                  <label htmlFor="file" className="block text-xs font-medium uppercase tracking-wide mb-1.5">
                    Audio File *
                  </label>
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    accept="audio/*"
                    className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700"
                    required={uploadMethod === 'file'}
                  />
                  {file && (
                    <p className="text-xs mt-1.5 font-medium text-gray-700">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              {uploadMethod === 'url' && (
                <div>
                  <label htmlFor="trackURL" className="block text-xs font-medium uppercase tracking-wide mb-1.5">
                    Track URL *
                  </label>
                  <input
                    type="url"
                    id="trackURL"
                    value={trackURL}
                    onChange={(e) => setTrackURL(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                    placeholder="https://drive.google.com/..."
                    required={uploadMethod === 'url'}
                  />
                  <p className="text-xs text-gray-600 mt-1.5">
                    Share privately with <strong>yonatanamir0@gmail.com</strong>
                  </p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Privacy Notice</p>
                <p>
                  By submitting, you confirm you own all rights to this music. We will <strong>never use or distribute</strong> your work.
                </p>
              </div>

              {uploading && uploadMethod === 'file' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
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
                disabled={
                  checkingSubmission ||
                  uploading ||
                  submissionStatus !== 'none' ||
                  (uploadMethod === 'file' && !file) ||
                  (uploadMethod === 'url' && !trackURL.trim())
                }
                className="w-full bg-black text-white px-6 py-3 font-medium tracking-wide uppercase text-xs hover:bg-gray-800 transition-all rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingSubmission
                  ? 'Checking...'
                  : uploading
                    ? (uploadMethod === 'file' ? 'Uploading...' : 'Submitting...')
                    : submissionStatus !== 'none'
                      ? 'Submission Locked'
                      : 'Submit Track'}
              </button>
            </form>
          </div>
        </motion.div>
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
