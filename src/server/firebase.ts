import { adminDb } from "~/lib/firebase-admin";
import type { DocumentData, WhereFilterOp } from "firebase-admin/firestore";

// Generic CRUD operations for Firestore using Admin SDK
export class FirestoreService {
  // Get all collections
  static async getCollections(): Promise<string[]> {
    try {
      const collections = await adminDb.listCollections();
      return collections.map((collection) => collection.id);
    } catch (error) {
      console.error("Error getting collections:", error);
      throw error;
    }
  }

  // Get all subcollections for a specific collection
  static async getSubcollections(collectionName: string): Promise<string[]> {
    try {
      const collectionRef = adminDb.collection(collectionName);
      const documents = await collectionRef.listDocuments();

      const subcollections = new Set<string>();

      for (const docRef of documents) {
        const subcollectionsList = await docRef.listCollections();
        subcollectionsList.forEach((subcollection) => {
          subcollections.add(subcollection.id);
        });
      }

      return Array.from(subcollections);
    } catch (error) {
      console.error("Error getting subcollections:", error);
      throw error;
    }
  }

  // Get subcollections for a specific document
  static async getDocumentSubcollections(
    collectionName: string,
    documentId: string,
  ): Promise<string[]> {
    try {
      const docRef = adminDb.collection(collectionName).doc(documentId);
      const subcollections = await docRef.listCollections();
      return subcollections.map((subcollection) => subcollection.id);
    } catch (error) {
      console.error("Error getting document subcollections:", error);
      throw error;
    }
  }

  // Get all document IDs from a collection
  static async getDocumentIds(collectionName: string): Promise<string[]> {
    try {
      const querySnapshot = await adminDb.collection(collectionName).get();
      return querySnapshot.docs.map((doc) => doc.id);
    } catch (error) {
      console.error("Error getting document IDs:", error);
      throw error;
    }
  }

  // Get documents from public scripts subcollection
  static async getPublicScripts<T = DocumentData>(): Promise<T[]> {
    try {
      const publicDocRef = adminDb.collection("public").doc("public_scripts");
      const subcollectionRef = publicDocRef.collection("uploaded_data");

      const querySnapshot = await subcollectionRef.get();

      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      return documents;
    } catch (error) {
      console.error("Error getting public scripts:", error);
      throw error;
    }
  }

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
    collectionName: string,
    subcollectionName: string,
  ): Promise<T[]> {
    try {
      const userDocRef = adminDb.collection(collectionName).doc(userId);
      const subcollectionRef = userDocRef.collection(subcollectionName);

      const querySnapshot = await subcollectionRef.get();

      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      return documents;
    } catch (error) {
      console.error("Error getting user documents:", error);
      throw error;
    }
  }

  // Count documents in a user-specific subcollection
  static async countUserDocuments(
    userId: string,
    collectionName: string,
    subcollectionName: string,
  ): Promise<number> {
    try {
      const userDocRef = adminDb.collection(collectionName).doc(userId);
      const subcollectionRef = userDocRef.collection(subcollectionName);

      const querySnapshot = await subcollectionRef.get();
      return querySnapshot.size;
    } catch (error) {
      console.error("Error counting user documents:", error);
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

  // Add a document to a specific collection and subcollection (admin function)
  static async addDocumentToSubcollection<T = DocumentData>(
    collectionName: string,
    documentId: string,
    subcollectionName: string,
    data: Omit<T, "id">,
  ): Promise<string> {
    try {
      const docRef = adminDb.collection(collectionName).doc(documentId);
      const subcollectionRef = docRef.collection(subcollectionName);

      console.log(
        "🔥 [FirestoreService.addDocumentToSubcollection] Adding document...",
      );
      const newDocRef = await subcollectionRef.add(data);

      console.log(
        "🔥 [FirestoreService.addDocumentToSubcollection] Document added successfully:",
      );
      console.log("  - Document ID:", newDocRef.id);
      console.log(
        "  - Full document path: " +
          collectionName +
          "/" +
          documentId +
          "/" +
          subcollectionName +
          "/" +
          newDocRef.id,
      );

      return newDocRef.id;
    } catch (error) {
      console.error(
        "🔥 [FirestoreService.addDocumentToSubcollection] Error:",
        error,
      );
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

  // Update a document in a user-specific subcollection
  static async updateUserDocument<T = DocumentData>(
    userId: string,
    subcollectionName: string,
    documentId: string,
    data: Partial<T>,
  ): Promise<void> {
    try {
      console.log("🔥 [FirestoreService.updateUserDocument] Starting update:");
      console.log("  - User ID:", userId);
      console.log("  - Subcollection:", subcollectionName);
      console.log("  - Document ID:", documentId);
      console.log("  - Update data:", data);

      const userDocRef = adminDb.collection("users").doc(userId);
      const subcollectionRef = userDocRef.collection(subcollectionName);
      const docRef = subcollectionRef.doc(documentId);

      console.log(
        "🔥 [FirestoreService.updateUserDocument] Full path:",
        `users/${userId}/${subcollectionName}/${documentId}`,
      );

      await docRef.update(data);

      console.log(
        "✅ [FirestoreService.updateUserDocument] Successfully updated document",
      );
    } catch (error) {
      console.error("❌ [FirestoreService.updateUserDocument] Error:", error);
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
    _filters?: Array<{ field: string; operator: WhereFilterOp; value: unknown }>,
    _orderByField?: string,
    _orderDirection?: "asc" | "desc",
    _limitCount?: number,
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
