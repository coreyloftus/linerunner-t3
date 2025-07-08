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
      const userDocRef = doc(db, "users", userId);
      const subcollectionRef = collection(userDocRef, subcollectionName);
      const querySnapshot = await getDocs(subcollectionRef);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error("Error getting user documents:", error);
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
      const userDocRef = doc(db, "users", userId);
      const subcollectionRef = collection(userDocRef, subcollectionName);
      const docRef = await addDoc(subcollectionRef, data);
      return docRef.id;
    } catch (error) {
      console.error("Error adding user document:", error);
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
    filters?: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection?: "asc" | "desc",
    limitCount?: number,
  ): Promise<T[]> {
    try {
      let q = collection(db, collectionName);

      // Apply filters
      if (filters && filters.length > 0) {
        filters.forEach((filter) => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection || "asc"));
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
