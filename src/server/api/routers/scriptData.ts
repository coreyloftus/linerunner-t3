import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { ScriptService, type GetAllResponse } from "~/server/scriptService";

export type {
  ProjectJSON,
  SceneJSON,
  GetAllResponse,
} from "~/server/scriptService";

export const scriptData = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        dataSource: z.enum(["local", "firestore", "public"]).default("local"),
      }),
    )
    .query(async ({ input, ctx }): Promise<GetAllResponse> => {
      if (input.dataSource === "firestore") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to access Firestore data",
          );
        }
        return ScriptService.getScripts("firestore", ctx.session.user.email);
      } else if (input.dataSource === "public") {
        return ScriptService.getScripts("public");
      } else {
        return ScriptService.getScripts("local");
      }
    }),

  getScenes: publicProcedure
    .input(
      z.object({
        project: z.string(),
        dataSource: z.enum(["local", "firestore", "public"]).default("local"),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (input.dataSource === "firestore") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to access Firestore data",
          );
        }
        return ScriptService.getScenes(
          input.project,
          "firestore",
          ctx.session.user.email,
        );
      } else if (input.dataSource === "public") {
        return ScriptService.getScenes(input.project, "public");
      } else {
        return ScriptService.getScenes(input.project, "local");
      }
    }),

  getCharacters: publicProcedure
    .input(
      z.object({
        project: z.string(),
        scene: z.string(),
        dataSource: z.enum(["local", "firestore", "public"]).default("local"),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (input.dataSource === "firestore") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to access Firestore data",
          );
        }
        return ScriptService.getCharacters(
          input.project,
          input.scene,
          "firestore",
          ctx.session.user.email,
        );
      } else if (input.dataSource === "public") {
        return ScriptService.getCharacters(
          input.project,
          input.scene,
          "public",
        );
      } else {
        return ScriptService.getCharacters(input.project, input.scene, "local");
      }
    }),

  getLines: publicProcedure
    .input(
      z.object({
        project: z.string(),
        scene: z.string(),
        dataSource: z.enum(["local", "firestore", "public"]).default("local"),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (input.dataSource === "firestore") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to access Firestore data",
          );
        }
        return ScriptService.getLines(
          input.project,
          input.scene,
          "firestore",
          ctx.session.user.email,
        );
      } else if (input.dataSource === "public") {
        return ScriptService.getLines(input.project, input.scene, "public");
      } else {
        return ScriptService.getLines(input.project, input.scene, "local");
      }
    }),

  createScript: protectedProcedure
    .input(
      z.object({
        projectName: z.string(),
        sceneTitle: z.string(),
        lines: z.array(
          z.object({
            character: z.string(),
            line: z.string(),
          }),
        ),
        dataSource: z.enum(["local", "firestore"]).default("local"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.dataSource === "firestore") {
        if (!ctx.session?.user?.email) {
          throw new Error("User must be authenticated to save to Firestore");
        }
        return ScriptService.saveScript(
          input.projectName,
          input.sceneTitle,
          input.lines,
          "firestore",
          ctx.session.user.email,
        );
      } else {
        return ScriptService.saveScript(
          input.projectName,
          input.sceneTitle,
          input.lines,
          "local",
        );
      }
    }),

  createAdminScript: protectedProcedure
    .input(
      z.object({
        projectName: z.string(),
        sceneTitle: z.string(),
        lines: z.array(
          z.object({
            character: z.string(),
            line: z.string(),
          }),
        ),
        collectionName: z.string(),
        documentId: z.string(),
        subcollectionName: z.string(),
        adminEmail: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if user is admin
      if (input.adminEmail !== "coreyloftus@gmail.com") {
        throw new Error("Admin access required");
      }

      return ScriptService.saveAdminScript(
        input.projectName,
        input.sceneTitle,
        input.lines,
        input.collectionName,
        input.documentId,
        input.subcollectionName,
      );
    }),

  updateScript: protectedProcedure
    .input(
      z.object({
        projectName: z.string(),
        sceneTitle: z.string(),
        updatedScript: z.object({
          project: z.string(),
          scenes: z.array(
            z.object({
              title: z.string(),
              lines: z.array(
                z.object({
                  character: z.string(),
                  line: z.string(),
                  sung: z.boolean().optional(),
                }),
              ),
            }),
          ),
        }),
        dataSource: z.enum(["local", "firestore"]).default("firestore"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.dataSource === "firestore") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to update Firestore data",
          );
        }
        return ScriptService.updateScript(
          input.projectName,
          input.sceneTitle,
          input.updatedScript,
          ctx.session.user.email,
        );
      } else {
        throw new Error("Local script updates not supported");
      }
    }),

  copyProjectBetweenUsers: protectedProcedure
    .input(
      z.object({
        sourceUserId: z.string().min(1, "Source user ID is required"),
        targetUserId: z.string().min(1, "Target user ID is required"),
        projectName: z.string().min(1, "Project name is required"),
        adminEmail: z.string().email("Valid admin email is required"),
      }),
    )
    .mutation(async ({ input }) => {
      // Import the FirestoreService
      const { FirestoreService } = await import("~/server/firebase");
      
      return FirestoreService.copyProjectBetweenUsers(
        input.sourceUserId,
        input.targetUserId,
        input.projectName,
        input.adminEmail,
      );
    }),
});
