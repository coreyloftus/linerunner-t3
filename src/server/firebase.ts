import { db } from "~/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type WhereFilterOp,
  type Query,
  type CollectionReference,
} from "firebase/firestore";

// Generic CRUD operations for Firestore
export class FirestoreService {
  // Get a single document
  static async getDocument<T = DocumentData>(
    collectionName: string,
    documentId: string,
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
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
      const querySnapshot = await getDocs(collection(db, collectionName));
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

      const userDocRef = doc(db, "users", userId);
      const subcollectionRef = collection(userDocRef, subcollectionName);

      console.log("🔥 [FirestoreService.getUserDocuments] Executing query...");
      const querySnapshot = await getDocs(subcollectionRef);

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
      const docRef = await addDoc(collection(db, collectionName), data);
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
        "  - Firestore path: users/" + userId + "/" + subcollectionName,
      );

      const userDocRef = doc(db, "users", userId);
      const subcollectionRef = collection(userDocRef, subcollectionName);

      console.log("🔥 [FirestoreService.addUserDocument] Adding document...");
      const docRef = await addDoc(subcollectionRef, data);

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
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, data);
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
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  // Query documents with filters
  static async queryDocuments<T = DocumentData>(
    collectionName: string,
    filters?: Array<{ field: string; operator: WhereFilterOp; value: unknown }>,
    orderByField?: string,
    orderDirection?: "asc" | "desc",
    limitCount?: number,
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName);
      let q: Query<DocumentData> | CollectionReference<DocumentData> =
        collectionRef;

      // Apply filters
      if (filters && filters.length > 0) {
        filters.forEach((filter) => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection ?? "asc"));
      }

      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
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

export { db };
