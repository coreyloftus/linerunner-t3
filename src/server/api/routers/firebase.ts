import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { FirestoreService } from "~/server/firebase";
import { type WhereFilterOp } from "firebase/firestore";

export type FirestoreFilter = {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
};
export const firebaseRouter = createTRPCRouter({
  // Example: Get all documents from a collection
  getDocuments: publicProcedure
    .input(z.object({ collectionName: z.string() }))
    .query(async ({ input }) => {
      try {
        const documents = await FirestoreService.getDocuments(
          input.collectionName,
        );
        return { success: true, data: documents };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }),

  // Get documents from user-specific subcollection (protected)
  getUserDocuments: protectedProcedure
    .input(
      z.object({
        subcollectionName: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const documents = await FirestoreService.getUserDocuments(
          ctx.session.user.id,
          input.subcollectionName,
        );
        return { success: true, data: documents };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }),

  // Example: Get a single document
  getDocument: publicProcedure
    .input(
      z.object({
        collectionName: z.string(),
        documentId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const document = await FirestoreService.getDocument(
          input.collectionName,
          input.documentId,
        );
        return { success: true, data: document };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }),

  // Example: Add a new document (protected - requires authentication)
  addDocument: protectedProcedure
    .input(
      z.object({
        collectionName: z.string(),
        data: z.record(z.any()),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const documentId = await FirestoreService.addDocument(
          input.collectionName,
          input.data,
        );
        return { success: true, documentId };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }),

  // Add a document to user-specific subcollection (protected)
  addUserDocument: protectedProcedure
    .input(
      z.object({
        subcollectionName: z.string(),
        data: z.record(z.any()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const documentId = await FirestoreService.addUserDocument(
          ctx.session.user.id,
          input.subcollectionName,
          input.data,
        );
        return { success: true, documentId };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }),

  // Example: Update a document (protected - requires authentication)
  updateDocument: protectedProcedure
    .input(
      z.object({
        collectionName: z.string(),
        documentId: z.string(),
        data: z.record(z.any()),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await FirestoreService.updateDocument(
          input.collectionName,
          input.documentId,
          input.data,
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }),

  // Example: Delete a document (protected - requires authentication)
  deleteDocument: protectedProcedure
    .input(
      z.object({
        collectionName: z.string(),
        documentId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await FirestoreService.deleteDocument(
          input.collectionName,
          input.documentId,
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }),

  // Example: Query documents with filters
  queryDocuments: publicProcedure
    .input(
      z.object({
        collectionName: z.string(),
        filters: z
          .array(
            z.object({
              field: z.string(),
              operator: z.custom<WhereFilterOp>(),
              value: z.unknown(),
            }),
          )
          .optional(),
        orderByField: z.string().optional(),
        orderDirection: z.enum(["asc", "desc"]).optional(),
        limitCount: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const documents = await FirestoreService.queryDocuments(
          input.collectionName,
          input.filters as FirestoreFilter[],
          input.orderByField,
          input.orderDirection,
          input.limitCount,
        );
        return { success: true, data: documents };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }),
});
