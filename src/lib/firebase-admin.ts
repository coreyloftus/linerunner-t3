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
  } catch (error) {
    console.error("🔧 [Firebase Admin] Error parsing service account:", error);
    return null;
  }
};

// Get service account once
const serviceAccount = getServiceAccount();

// Firebase Admin SDK configuration
const firebaseAdminConfig = {
  projectId: env.FIREBASE_PROJECT_ID,
  // Use base64 encoded service account key from environment variable
  credential: serviceAccount ? cert(serviceAccount) : undefined,
};

console.log("🔧 [Firebase Admin] Configuration:");
console.log("  - Project ID:", env.FIREBASE_PROJECT_ID);
console.log("  - Service Account Available:", !!serviceAccount);
console.log("  - Credential Available:", !!firebaseAdminConfig.credential);

// Debug logging to check if service account is loaded correctly
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const decodedKey = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      "base64",
    ).toString();
    const serviceAccount = JSON.parse(decodedKey) as {
      project_id: string;
      client_email: string;
      private_key: string;
      [key: string]: unknown;
    };
    console.log("🔧 [Firebase Admin] Service account loaded successfully:");
    console.log("  - Project ID:", serviceAccount.project_id);
    console.log("  - Client Email:", serviceAccount.client_email);
    console.log(
      "  - Private Key Length:",
      serviceAccount.private_key?.length ?? 0,
    );
    console.log("  - Raw JSON keys:", Object.keys(serviceAccount));
  } catch (error) {
    console.error("🔧 [Firebase Admin] Error loading service account:", error);
  }
} else {
  console.log(
    "🔧 [Firebase Admin] No service account key found in environment",
  );
}

// Initialize Firebase Admin only if it hasn't been initialized already
let adminApp;
try {
  adminApp =
    getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]!;
  console.log("🔧 [Firebase Admin] App initialized successfully");
} catch (error) {
  console.error("🔧 [Firebase Admin] Error initializing app:", error);
  throw error;
}

// Get Firestore instance (using default database)
const adminDb = getFirestore(adminApp, "scripts");
console.log(
  "🔧 [Firebase Admin] Firestore instance created for scripts database",
);

export { adminDb };
