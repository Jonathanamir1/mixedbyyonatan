import type { NextConfig } from "next";

function readFirebaseWebConfig() {
  const raw =
    process.env.FIREBASE_WEBAPP_CONFIG ||
    process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      apiKey?: string;
      appId?: string;
      authDomain?: string;
      messagingSenderId?: string;
      projectId?: string;
      storageBucket?: string;
      measurementId?: string;
    };

    return parsed;
  } catch {
    return null;
  }
}

const firebaseWebConfig = readFirebaseWebConfig();

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.48'],
  env: {
    ...(firebaseWebConfig?.apiKey ? { NEXT_PUBLIC_FIREBASE_API_KEY: firebaseWebConfig.apiKey } : {}),
    ...(firebaseWebConfig?.authDomain ? { NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseWebConfig.authDomain } : {}),
    ...(firebaseWebConfig?.projectId ? { NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseWebConfig.projectId } : {}),
    ...(firebaseWebConfig?.storageBucket ? { NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseWebConfig.storageBucket } : {}),
    ...(firebaseWebConfig?.messagingSenderId ? { NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseWebConfig.messagingSenderId } : {}),
    ...(firebaseWebConfig?.appId ? { NEXT_PUBLIC_FIREBASE_APP_ID: firebaseWebConfig.appId } : {}),
    ...(firebaseWebConfig?.measurementId ? { NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: firebaseWebConfig.measurementId } : {}),
  },
};

export default nextConfig;
