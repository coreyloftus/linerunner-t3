import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { FirestoreService, db as adminDb } from "~/server/firebase";
import { showInputSchema, showSizeError } from "~/lib/script-limits";

export const firebaseRouter = createTRPCRouter({
  // Get documents from user-specific subcollection (protected)
  getUserDocuments: protectedProcedure
    .input(
      z.object({
        subcollectionName: z.literal("uploaded_data"),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.session.user.email) {
        throw new Error("User email is required");
      }
      try {
        const documents = await FirestoreService.getUserDocuments(
          ctx.session.user.email,
          "users",
          input.subcollectionName,
        );

        return { success: true, data: documents };
      } catch (error) {
        console.error("❌ [getUserDocuments] Error:", error);
        return { success: false, error: (error as Error).message };
      }
    }),

  // Get all collections (admin only)
  getCollections: adminProcedure.query(async () => {
    try {
      const collections = await FirestoreService.getCollections();
      return { success: true, data: collections };
    } catch (error) {
      console.error("❌ [getCollections] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  }),

  // Get subcollections for a specific collection (admin only)
  getSubcollections: adminProcedure
    .input(
      z.object({
        collectionName: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const subcollections = await FirestoreService.getSubcollections(
          input.collectionName,
        );
        return { success: true, data: subcollections };
      } catch (error) {
        console.error("❌ [getSubcollections] Error:", error);
        return { success: false, error: (error as Error).message };
      }
    }),

  // Get document IDs from a collection (admin only)
  getDocumentIds: adminProcedure
    .input(
      z.object({
        collectionName: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const documentIds = await FirestoreService.getDocumentIds(
          input.collectionName,
        );
        return { success: true, data: documentIds };
      } catch (error) {
        console.error("❌ [getDocumentIds] Error:", error);
        return { success: false, error: (error as Error).message };
      }
    }),

  // Get user document count (protected)
  getUserDocumentCount: protectedProcedure
    .input(
      z.object({
        subcollectionName: z.literal("uploaded_data"),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.session.user.email) {
        throw new Error("User email is required");
      }
      try {
        const count = await FirestoreService.countUserDocuments(
          ctx.session.user.email,
          "users",
          input.subcollectionName,
        );
        return { success: true, count };
      } catch (error) {
        console.error("❌ [getUserDocumentCount] Error:", error);
        return { success: false, error: (error as Error).message };
      }
    }),

  // Add a document to user-specific subcollection (protected)
  addUserDocument: protectedProcedure
    .input(
      z.object({
        subcollectionName: z.literal("uploaded_data"),
        data: showInputSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session.user.email) {
        throw new Error("User email is required");
      }
      try {
        const sizeError = showSizeError(input.data);
        if (sizeError) return { success: false, error: sizeError };

        const documentId = await FirestoreService.addUserDocument(
          ctx.session.user.email,
          input.subcollectionName,
          input.data,
        );

        return { success: true, documentId };
      } catch (error) {
        console.error("❌ [addUserDocument] Error:", error);
        return { success: false, error: (error as Error).message };
      }
    }),

  // Delete a user document (protected)
  deleteUserDocument: protectedProcedure
    .input(
      z.object({
        subcollectionName: z.literal("uploaded_data"),
        documentId: z.string().min(1).max(1500).regex(/^[^/]+$/),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session.user.email) {
        throw new Error("User email is required");
      }
      try {
        const userDocRef = adminDb
          .collection("users")
          .doc(ctx.session.user.email);
        const subcollectionRef = userDocRef.collection(input.subcollectionName);
        const documentRef = subcollectionRef.doc(input.documentId);
        await documentRef.delete();
        return { success: true };
      } catch (error) {
        console.error("❌ [deleteUserDocument] Error:", error);
        return { success: false, error: (error as Error).message };
      }
    }),
});
