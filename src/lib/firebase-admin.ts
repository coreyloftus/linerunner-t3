import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "~/env";

// Parse service account key once
const getServiceAccount = () => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return null;

  try {
    const decodedKey = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      "base64",
    ).toString();
    const rawServiceAccount = JSON.parse(decodedKey) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    return {
      projectId: rawServiceAccount.project_id,
      clientEmail: rawServiceAccount.client_email,
      privateKey: rawServiceAccount.private_key,
    } as ServiceAccount;
  } catch {
    throw new Error("Invalid Firebase service account configuration.");
  }
};

// Get service account once
const serviceAccount = getServiceAccount();

// Firebase Admin SDK configuration
const firebaseAdminConfig = {
  projectId: env.FIREBASE_PROJECT_ID,
  // Use base64 encoded service account key from environment variable
  ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
};

// Initialize Firebase Admin only if it hasn't been initialized already
let adminApp;
try {
  adminApp =
    getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]!;
} catch (error) {
  console.error("🔧 [Firebase Admin] Error initializing app:", error);
  throw error;
}

// Get Firestore instance (using default database)
const adminDb = getFirestore(adminApp, "scripts");

export { adminDb };
