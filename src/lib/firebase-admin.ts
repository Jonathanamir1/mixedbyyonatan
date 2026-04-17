import { getApps, initializeApp, applicationDefault, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

type FirebaseConfig = {
  projectId?: string;
  storageBucket?: string;
  databaseURL?: string;
};

function getFirebaseConfig() {
  const raw = process.env.FIREBASE_CONFIG;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FirebaseConfig;
  } catch {
    return null;
  }
}

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getProjectId() {
  return (
    getFirebaseConfig()?.projectId ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    null
  );
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = getProjectId();
  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    return initializeApp({
      projectId: projectId || serviceAccount.project_id,
      credential: cert(serviceAccount),
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: projectId || undefined,
  });
}

export const adminApp = getAdminApp();
export const adminFirestore = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
