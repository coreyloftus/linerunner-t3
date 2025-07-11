import { adminDb } from "./firebase-admin";

// Simple test function
export async function testFirebaseConnection() {
  try {
    console.log("🧪 [Firebase Test] Starting connection test...");
    console.log(
      "🧪 [Firebase Test] Environment variable exists:",
      !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    );

    console.log("🧪 [Firebase Test] Using existing Firebase Admin instance");

    // Try a simple query using the existing adminDb instance
    const testCollection = adminDb.collection("test");
    const snapshot = await testCollection.limit(1).get();

    console.log("🧪 [Firebase Test] Query successful!");
    console.log("🧪 [Firebase Test] Documents found:", snapshot.docs.length);

    return true;
  } catch (error) {
    console.error("🧪 [Firebase Test] Error:", error);
    return false;
  }
}
