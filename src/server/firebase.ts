import { adminDb } from "~/lib/firebase-admin";
import type { DocumentData, WhereFilterOp } from "firebase-admin/firestore";

// Generic CRUD operations for Firestore using Admin SDK
export class FirestoreService {
  // Get a single document
  static async getDocument<T = DocumentData>(
    collectionName: string,
    documentId: string,
  ): Promise<T | null> {
    try {
      const docRef = adminDb.collection(collectionName).doc(documentId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting document:", error);
      throw error;
    }
  }

  // Get all documents from a collection
  static async getDocuments<T = DocumentData>(
    collectionName: string,
  ): Promise<T[]> {
    try {
      const querySnapshot = await adminDb.collection(collectionName).get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error("Error getting documents:", error);
      throw error;
    }
  }

  // Get documents from a user-specific subcollection
  static async getUserDocuments<T = DocumentData>(
    userId: string,
    subcollectionName: string,
  ): Promise<T[]> {
    try {
      console.log("🔥 [FirestoreService.getUserDocuments] Constructing path:");
      console.log("  - User ID:", userId);
      console.log("  - Subcollection:", subcollectionName);
      console.log(
        "  - Firestore path: users/" + userId + "/" + subcollectionName,
      );

      // First, let's test if we can access Firestore at all
      console.log(
        "🔥 [FirestoreService.getUserDocuments] Testing basic Firestore access...",
      );
      try {
        const testCollection = adminDb.collection("test");
        await testCollection.limit(1).get();
        console.log(
          "🔥 [FirestoreService.getUserDocuments] Basic Firestore access successful",
        );
      } catch (testError) {
        console.error(
          "🔥 [FirestoreService.getUserDocuments] Basic Firestore access failed:",
          testError,
        );
        throw testError;
      }

      const userDocRef = adminDb.collection("users").doc(userId);
      const subcollectionRef = userDocRef.collection(subcollectionName);

      console.log("🔥 [FirestoreService.getUserDocuments] Executing query...");
      const querySnapshot = await subcollectionRef.get();

      console.log("🔥 [FirestoreService.getUserDocuments] Query completed:");
      console.log("  - Documents found:", querySnapshot.docs.length);

      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      console.log(
        "🔥 [FirestoreService.getUserDocuments] Returning documents:",
        documents,
      );
      return documents;
    } catch (error) {
      console.error("🔥 [FirestoreService.getUserDocuments] Error:", error);
      throw error;
    }
  }

  // Add a new document
  static async addDocument<T = DocumentData>(
    collectionName: string,
    data: Omit<T, "id">,
  ): Promise<string> {
    try {
      const docRef = await adminDb.collection(collectionName).add(data);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  }

  // Add a document to a user-specific subcollection
  static async addUserDocument<T = DocumentData>(
    userId: string,
    subcollectionName: string,
    data: Omit<T, "id">,
  ): Promise<string> {
    try {
      console.log("🔥 [FirestoreService.addUserDocument] Constructing path:");
      console.log("  - User ID:", userId);
      console.log("  - Subcollection:", subcollectionName);
      console.log("  - Data to add:", data);
      console.log(
        "  - Firestore path: scripts/users/" + userId + "/" + subcollectionName,
      );

      const userDocRef = adminDb.collection("users").doc(userId);
      const subcollectionRef = userDocRef.collection(subcollectionName);

      console.log("🔥 [FirestoreService.addUserDocument] Adding document...");
      const docRef = await subcollectionRef.add(data);

      console.log(
        "🔥 [FirestoreService.addUserDocument] Document added successfully:",
      );
      console.log("  - Document ID:", docRef.id);
      console.log(
        "  - Full document path: users/" +
          userId +
          "/" +
          subcollectionName +
          "/" +
          docRef.id,
      );

      return docRef.id;
    } catch (error) {
      console.error("🔥 [FirestoreService.addUserDocument] Error:", error);
      throw error;
    }
  }

  // Update a document
  static async updateDocument<T = DocumentData>(
    collectionName: string,
    documentId: string,
    data: Partial<T>,
  ): Promise<void> {
    try {
      const docRef = adminDb.collection(collectionName).doc(documentId);
      await docRef.update(data);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  }

  // Delete a document
  static async deleteDocument(
    collectionName: string,
    documentId: string,
  ): Promise<void> {
    try {
      const docRef = adminDb.collection(collectionName).doc(documentId);
      await docRef.delete();
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  // Query documents with filters (simplified for now)
  static async queryDocuments<T = DocumentData>(
    collectionName: string,
    filters?: Array<{ field: string; operator: WhereFilterOp; value: unknown }>,
    orderByField?: string,
    orderDirection?: "asc" | "desc",
    limitCount?: number,
  ): Promise<T[]> {
    try {
      // For now, just get all documents from the collection
      // TODO: Implement proper filtering and ordering
      const querySnapshot = await adminDb.collection(collectionName).get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error("Error querying documents:", error);
      throw error;
    }
  }
}

export { adminDb as db };
