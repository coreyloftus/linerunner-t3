import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { ScriptService, type GetAllResponse } from "~/server/scriptService";
import { FirestoreService, type SharedProjectJSON } from "~/server/firebase";

export type {
  ProjectJSON,
  SceneJSON,
  LineJSON,
  GetAllResponse,
} from "~/server/scriptService";

export const scriptData = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        dataSource: z.enum(["local", "firestore", "public", "shared"]).default("local"),
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
      } else if (input.dataSource === "shared") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to access shared projects",
          );
        }
        return ScriptService.getScripts("shared", ctx.session.user.email);
      } else {
        return ScriptService.getScripts("local");
      }
    }),

  getScenes: publicProcedure
    .input(
      z.object({
        project: z.string(),
        dataSource: z.enum(["local", "firestore", "public", "shared"]).default("local"),
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
      } else if (input.dataSource === "shared") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to access shared projects",
          );
        }
        return ScriptService.getScenes(
          input.project,
          "shared",
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
        dataSource: z.enum(["local", "firestore", "public", "shared"]).default("local"),
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
      } else if (input.dataSource === "shared") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to access shared projects",
          );
        }
        return ScriptService.getCharacters(
          input.project,
          input.scene,
          "shared",
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
        dataSource: z.enum(["local", "firestore", "public", "shared"]).default("local"),
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
      } else if (input.dataSource === "shared") {
        if (!ctx.session?.user?.email) {
          throw new Error(
            "User must be authenticated to access shared projects",
          );
        }
        return ScriptService.getLines(
          input.project,
          input.scene,
          "shared",
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
            characters: z.array(z.string()),
            line: z.string(),
            sung: z.boolean().optional(),
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
            characters: z.array(z.string()),
            line: z.string(),
            sung: z.boolean().optional(),
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
                  characters: z.array(z.string()),
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
      return FirestoreService.copyProjectBetweenUsers(
        input.sourceUserId,
        input.targetUserId,
        input.projectName,
        input.adminEmail,
      );
    }),

  // ============ SHARED PROJECT ADMIN PROCEDURES ============

  // Get all shared projects (admin only - for management UI)
  getAllSharedProjects: protectedProcedure
    .query(async ({ ctx }): Promise<SharedProjectJSON[]> => {
      if (ctx.session.user.email !== "coreyloftus@gmail.com") {
        throw new Error("Admin access required");
      }
      return FirestoreService.getAllSharedProjects();
    }),

  // Share an existing project from admin's collection
  shareExistingProject: protectedProcedure
    .input(
      z.object({
        projectName: z.string().min(1, "Project name is required"),
        allowedUsers: z.array(z.string().email("Valid email required")),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.email !== "coreyloftus@gmail.com") {
        throw new Error("Admin access required");
      }

      // Get the project from admin's Firestore collection
      const adminScripts = await ScriptService.getScripts(
        "firestore",
        ctx.session.user.email,
      );

      const projectToShare = adminScripts.allData.find(
        (p) => p.project === input.projectName,
      );

      if (!projectToShare) {
        throw new Error(`Project "${input.projectName}" not found`);
      }

      // Create the shared project
      const sharedProjectId = await FirestoreService.createSharedProject(
        projectToShare,
        input.allowedUsers,
        ctx.session.user.email,
      );

      return {
        success: true,
        message: `Project "${input.projectName}" shared successfully`,
        sharedProjectId,
      };
    }),

  // Update permissions for a shared project
  updateSharedProjectPermissions: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "Project ID is required"),
        allowedUsers: z.array(z.string().email("Valid email required")),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.email !== "coreyloftus@gmail.com") {
        throw new Error("Admin access required");
      }

      await FirestoreService.updateSharedProjectPermissions(
        input.projectId,
        input.allowedUsers,
        ctx.session.user.email,
      );

      return {
        success: true,
        message: "Permissions updated successfully",
      };
    }),

  // Sync/update a shared project's content from admin's source project
  syncSharedProject: protectedProcedure
    .input(
      z.object({
        sharedProjectId: z.string().min(1, "Shared project ID is required"),
        sourceProjectName: z.string().min(1, "Source project name is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.email !== "coreyloftus@gmail.com") {
        throw new Error("Admin access required");
      }

      // Get the source project from admin's Firestore collection
      const adminScripts = await ScriptService.getScripts(
        "firestore",
        ctx.session.user.email,
      );

      const sourceProject = adminScripts.allData.find(
        (p) => p.project === input.sourceProjectName,
      );

      if (!sourceProject) {
        throw new Error(`Source project "${input.sourceProjectName}" not found`);
      }

      // Update the shared project's content
      await FirestoreService.updateSharedProject(
        input.sharedProjectId,
        {
          project: sourceProject.project,
          scenes: sourceProject.scenes,
          characters: sourceProject.characters,
        },
        ctx.session.user.email,
      );

      return {
        success: true,
        message: `Shared project synced with "${input.sourceProjectName}"`,
      };
    }),

  // Delete a shared project
  deleteSharedProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "Project ID is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.email !== "coreyloftus@gmail.com") {
        throw new Error("Admin access required");
      }

      await FirestoreService.deleteSharedProject(
        input.projectId,
        ctx.session.user.email,
      );

      return {
        success: true,
        message: "Shared project deleted successfully",
      };
    }),
});
