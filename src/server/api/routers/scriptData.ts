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
        dataSource: z.enum(["local", "firestore"]).default("local"),
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
      } else {
        return ScriptService.getScripts("local");
      }
    }),

  getScenes: publicProcedure
    .input(
      z.object({
        project: z.string(),
        dataSource: z.enum(["local", "firestore"]).default("local"),
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
      } else {
        return ScriptService.getScenes(input.project, "local");
      }
    }),

  getCharacters: publicProcedure
    .input(
      z.object({
        project: z.string(),
        scene: z.string(),
        dataSource: z.enum(["local", "firestore"]).default("local"),
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
      } else {
        return ScriptService.getCharacters(input.project, input.scene, "local");
      }
    }),

  getLines: publicProcedure
    .input(
      z.object({
        project: z.string(),
        scene: z.string(),
        dataSource: z.enum(["local", "firestore"]).default("local"),
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
});
