import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { FirestoreService } from "~/server/firebase";
import { type WhereFilterOp } from "firebase/firestore";
import { testFirebaseConnection } from "~/lib/firebase-admin-test";

export type FirestoreFilter = {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
};
export const firebaseRouter = createTRPCRouter({
  // Test Firebase connection
  testConnection: publicProcedure.query(async () => {
    try {
      console.log("🧪 [tRPC Test] Starting test connection...");
      const result = await testFirebaseConnection();
      console.log("🧪 [tRPC Test] Test completed with result:", result);
      return { success: result };
    } catch (error) {
      console.error("🧪 [tRPC Test] Error in test connection:", error);
      return { success: false, error: (error as Error).message };
    }
  }),

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
      if (!ctx.session.user.email) {
        throw new Error("User email is required");
      }
      try {
        console.log("🔍 [getUserDocuments] Starting query with:");
        console.log("  - User Email:", ctx.session.user.email);
        console.log("  - Subcollection:", input.subcollectionName);
        console.log(
          "  - Full path: users/" +
            ctx.session.user.email +
            "/" +
            input.subcollectionName,
        );

        const documents = await FirestoreService.getUserDocuments(
          ctx.session.user.email,
          "users",
          input.subcollectionName,
        );

        console.log(
          "✅ [getUserDocuments] Success - Found",
          documents.length,
          "documents",
        );
        console.log("  - Documents:", documents);

        return { success: true, data: documents };
      } catch (error) {
        console.error("❌ [getUserDocuments] Error:", error);
        return { success: false, error: (error as Error).message };
      }
    }),

  // Get all collections (admin only)
  getCollections: protectedProcedure
    .input(
      z.object({
        adminEmail: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Check if user is admin (you can enhance this with proper role checking)
        if (input.adminEmail !== "coreyloftus@gmail.com") {
          throw new Error("Admin access required");
        }

        const collections = await FirestoreService.getCollections();
        return { success: true, data: collections };
      } catch (error) {
        console.error("❌ [getCollections] Error:", error);
        return { success: false, error: (error as Error).message };
      }
    }),

  // Get subcollections for a specific collection (admin only)
  getSubcollections: protectedProcedure
    .input(
      z.object({
        collectionName: z.string(),
        adminEmail: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Check if user is admin (you can enhance this with proper role checking)
        if (input.adminEmail !== "coreyloftus@gmail.com") {
          throw new Error("Admin access required");
        }

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
  getDocumentIds: protectedProcedure
    .input(
      z.object({
        collectionName: z.string(),
        adminEmail: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Check if user is admin (you can enhance this with proper role checking)
        if (input.adminEmail !== "coreyloftus@gmail.com") {
          throw new Error("Admin access required");
        }

        const documentIds = await FirestoreService.getDocumentIds(
          input.collectionName,
        );
        return { success: true, data: documentIds };
      } catch (error) {
        console.error("❌ [getDocumentIds] Error:", error);
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
      if (!ctx.session.user.email) {
        throw new Error("User email is required");
      }
      try {
        console.log("📝 [addUserDocument] Starting mutation with:");
        console.log("  - User Email:", ctx.session.user.email);
        console.log("  - Subcollection:", input.subcollectionName);
        console.log("  - Data:", input.data);
        console.log(
          "  - Full path: users/" +
            ctx.session.user.email +
            "/" +
            input.subcollectionName,
        );

        const documentId = await FirestoreService.addUserDocument(
          ctx.session.user.email,
          input.subcollectionName,
          input.data,
        );

        console.log(
          "✅ [addUserDocument] Success - Document created with ID:",
          documentId,
        );
        console.log(
          "  - Full document path: users/" +
            ctx.session.user.email +
            "/" +
            input.subcollectionName +
            "/" +
            documentId,
        );

        return { success: true, documentId };
      } catch (error) {
        console.error("❌ [addUserDocument] Error:", error);
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
