import fs from "fs";
import path from "path";
import { FirestoreService } from "./firebase";

export interface ProjectJSON {
  project: string;
  scenes: SceneJSON[];
}

export interface SceneJSON {
  title: string;
  lines: {
    character: string;
    line: string;
    sung?: boolean;
  }[];
}

export interface GetAllResponse {
  projects: string[];
  allData: ProjectJSON[];
}

export class ScriptService {
  // Load scripts from local files
  static async getLocalScripts(): Promise<GetAllResponse> {
    const directory = path.join(process.cwd(), "public/sceneData");
    const files = fs.readdirSync(directory);
    const allData: ProjectJSON[] = files
      .map((file) => {
        const data = fs.readFileSync(path.join(directory, file), "utf8");
        return JSON.parse(data) as ProjectJSON;
      })
      .flat();

    const projects = allData.map((file) => file.project);
    return {
      projects,
      allData,
    };
  }

  // Load scripts from Firestore
  static async getFirestoreScripts(userId: string): Promise<GetAllResponse> {
    try {
      const documents = await FirestoreService.getUserDocuments<
        ProjectJSON & { id: string }
      >(userId, "users", "uploaded_data");

      const projects = documents.map((doc) => doc.project);
      return {
        projects,
        allData: documents,
      };
    } catch (error) {
      console.error("Error loading Firestore scripts:", error);
      // Return empty data if Firestore fails
      return {
        projects: [],
        allData: [],
      };
    }
  }

  // Load public scripts from Firestore
  static async getPublicScripts(): Promise<GetAllResponse> {
    try {
      const documents = await FirestoreService.getPublicScripts<ProjectJSON>();

      const projects = documents.map((doc) => doc.project);
      return {
        projects,
        allData: documents,
      };
    } catch (error) {
      console.error("Error loading public scripts:", error);
      // Return empty data if Firestore fails
      return {
        projects: [],
        allData: [],
      };
    }
  }

  // Load shared scripts from Firestore
  static async getSharedScripts(userId: string): Promise<GetAllResponse> {
    try {
      const documents = await FirestoreService.getSharedScripts<ProjectJSON>(
        userId,
      );

      const projects = documents.map((doc) => doc.project);
      return {
        projects,
        allData: documents,
      };
    } catch (error) {
      console.error("Error loading shared scripts:", error);
      // Return empty data if Firestore fails
      return {
        projects: [],
        allData: [],
      };
    }
  }

  // Unified method to get scripts based on data source
  static async getScripts(
    dataSource: "local" | "firestore" | "public" | "shared",
    userId?: string,
  ): Promise<GetAllResponse> {
    if (dataSource === "local") {
      return this.getLocalScripts();
    } else if (dataSource === "firestore" && userId) {
      return this.getFirestoreScripts(userId);
    } else if (dataSource === "public") {
      return this.getPublicScripts();
    } else if (dataSource === "shared" && userId) {
      return this.getSharedScripts(userId);
    } else {
      throw new Error("Invalid data source or missing userId for Firestore/Shared");
    }
  }

  // Get scenes for a specific project
  static async getScenes(
    project: string,
    dataSource: "local" | "firestore" | "public" | "shared",
    userId?: string,
  ): Promise<{ sceneTitles: string[] | undefined }> {
    const { allData } = await this.getScripts(dataSource, userId);
    const scenes = allData.find((file) => file.project === project)?.scenes;
    const sceneTitles = scenes?.map((scene) => scene.title);
    return { sceneTitles };
  }

  // Get characters for a specific project and scene
  static async getCharacters(
    project: string,
    scene: string,
    dataSource: "local" | "firestore" | "public" | "shared",
    userId?: string,
  ): Promise<{ characters: string[] | undefined }> {
    const { allData } = await this.getScripts(dataSource, userId);
    const characters = allData
      .find((file) => file.project === project)
      ?.scenes.find((sceneData) => sceneData.title === scene)
      ?.lines.map((line) => line.character);
    return { characters };
  }

  // Get lines for a specific project and scene
  static async getLines(
    project: string,
    scene: string,
    dataSource: "local" | "firestore" | "public" | "shared",
    userId?: string,
  ): Promise<string[]> {
    const { allData } = await this.getScripts(dataSource, userId);
    const lines = allData
      .find((file) => file.project === project)
      ?.scenes.find((sceneData) => sceneData.title === scene)
      ?.lines.map((line) => line.line);
    return lines ?? [];
  }

  // Save script to local files or Firestore
  static async saveScript(
    projectName: string,
    sceneTitle: string,
    lines: { character: string; line: string }[],
    dataSource: "local" | "firestore",
    userId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (dataSource === "local") {
        return this.saveLocalScript(projectName, sceneTitle, lines);
      } else if (dataSource === "firestore" && userId) {
        return this.saveFirestoreScript(projectName, sceneTitle, lines, userId);
      } else {
        throw new Error("Invalid data source or missing userId for Firestore");
      }
    } catch (error) {
      console.error("Error saving script:", error);
      return { success: false, message: (error as Error).message };
    }
  }

  // Save script to local file
  private static async saveLocalScript(
    projectName: string,
    sceneTitle: string,
    lines: { character: string; line: string }[],
  ): Promise<{ success: boolean; message: string }> {
    try {
      const directory = path.join(process.cwd(), "public/sceneData");

      // Create directory if it doesn't exist
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // Create the script data structure
      const scriptData: ProjectJSON = {
        project: projectName,
        scenes: [
          {
            title: sceneTitle,
            lines: lines,
          },
        ],
      };

      // Generate filename from project name
      const filename = `${projectName.toLowerCase().replace(/\s+/g, "-")}.json`;
      const filepath = path.join(directory, filename);

      // Write to file
      fs.writeFileSync(filepath, JSON.stringify(scriptData, null, 2));

      return { success: true, message: `Script saved to ${filename}` };
    } catch (error) {
      console.error("Error saving local script:", error);
      return { success: false, message: (error as Error).message };
    }
  }

  // Save script to Firestore
  private static async saveFirestoreScript(
    projectName: string,
    sceneTitle: string,
    lines: { character: string; line: string }[],
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔍 [ScriptService.saveFirestoreScript] Starting with:");
      console.log("  - Project Name:", projectName);
      console.log("  - Scene Title:", sceneTitle);
      console.log("  - User ID:", userId);

      // First, check if a document with this project already exists
      const existingDocuments = await FirestoreService.getUserDocuments<
        ProjectJSON & { id: string }
      >(userId, "users", "uploaded_data");

      console.log(
        "🔍 [ScriptService.saveFirestoreScript] Found",
        existingDocuments.length,
        "existing documents",
      );
      console.log(
        "  - Existing documents:",
        existingDocuments.map((doc) => ({ id: doc.id, project: doc.project })),
      );

      const existingProjectDoc = existingDocuments.find(
        (doc) => doc.project.trim() === projectName.trim(),
      );

      console.log(
        "🔍 [ScriptService.saveFirestoreScript] Looking for project:",
        projectName,
      );
      console.log("  - Project name (trimmed):", `"${projectName.trim()}"`);
      console.log(
        "  - Found existing project:",
        existingProjectDoc ? "YES" : "NO",
      );

      // Show detailed comparison for debugging
      existingDocuments.forEach((doc, index) => {
        const docProjectTrimmed = doc.project.trim();
        const projectNameTrimmed = projectName.trim();
        const matches = docProjectTrimmed === projectNameTrimmed;
        console.log(
          `  - Document ${index}: "${docProjectTrimmed}" === "${projectNameTrimmed}" = ${matches}`,
        );
      });

      if (existingProjectDoc) {
        console.log("  - Existing project document ID:", existingProjectDoc.id);
        console.log(
          "  - Existing project scenes count:",
          existingProjectDoc.scenes.length,
        );
      }

      if (existingProjectDoc) {
        // Project exists, add the new scene to the existing document
        const updatedScenes = [
          ...existingProjectDoc.scenes,
          {
            title: sceneTitle,
            lines: lines,
          },
        ];

        console.log(
          "🔍 [ScriptService.saveFirestoreScript] Updating existing project",
        );
        console.log("  - New scenes count:", updatedScenes.length);

        await FirestoreService.updateUserDocument(
          userId,
          "uploaded_data",
          existingProjectDoc.id,
          { scenes: updatedScenes },
        );

        console.log(
          "✅ [ScriptService.saveFirestoreScript] Successfully updated existing project",
        );

        return {
          success: true,
          message: `Scene "${sceneTitle}" added to existing project "${projectName}"`,
        };
      } else {
        // Project doesn't exist, create a new document
        console.log(
          "🔍 [ScriptService.saveFirestoreScript] Creating new project document",
        );

        const scriptData: ProjectJSON = {
          project: projectName,
          scenes: [
            {
              title: sceneTitle,
              lines: lines,
            },
          ],
        };

        const documentId = await FirestoreService.addUserDocument(
          userId,
          "uploaded_data",
          scriptData,
        );

        console.log(
          "✅ [ScriptService.saveFirestoreScript] Successfully created new project with ID:",
          documentId,
        );

        return {
          success: true,
          message: `Script saved to Firestore with ID: ${documentId}`,
        };
      }
    } catch (error) {
      console.error("❌ [ScriptService.saveFirestoreScript] Error:", error);
      return { success: false, message: (error as Error).message };
    }
  }

  // Save script to specific collection/subcollection (admin function)
  static async saveAdminScript(
    projectName: string,
    sceneTitle: string,
    lines: { character: string; line: string }[],
    collectionName: string,
    documentId: string,
    subcollectionName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const scriptData: ProjectJSON = {
        project: projectName,
        scenes: [
          {
            title: sceneTitle,
            lines: lines,
          },
        ],
      };

      const newDocumentId = await FirestoreService.addDocumentToSubcollection(
        collectionName,
        documentId,
        subcollectionName,
        scriptData,
      );

      return {
        success: true,
        message: `Script saved to ${collectionName}/${documentId}/${subcollectionName} with ID: ${newDocumentId}`,
      };
    } catch (error) {
      console.error("Error saving admin script:", error);
      return { success: false, message: (error as Error).message };
    }
  }

  // Update existing script in Firestore
  static async updateScript(
    projectName: string,
    sceneTitle: string,
    updatedScript: ProjectJSON,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔍 [ScriptService.updateScript] Starting with:");
      console.log("  - Project Name:", projectName);
      console.log("  - Scene Title:", sceneTitle);
      console.log("  - User ID:", userId);

      // Get existing documents to find the one to update
      const existingDocuments = await FirestoreService.getUserDocuments<
        ProjectJSON & { id: string }
      >(userId, "users", "uploaded_data");

      const existingProjectDoc = existingDocuments.find(
        (doc) => doc.project.trim() === projectName.trim(),
      );

      if (!existingProjectDoc) {
        return { success: false, message: "Project not found" };
      }

      // Find the scene being updated from the updatedScript
      const updatedScene = updatedScript.scenes[0]; // The edited scene
      if (!updatedScene) {
        return { success: false, message: "No scene data provided" };
      }

      // Create a new scenes array with the updated scene
      const updatedScenes = existingProjectDoc.scenes.map((scene) => {
        // If this is the scene being updated, replace it
        if (scene.title.trim() === sceneTitle.trim()) {
          return updatedScene;
        }
        // Otherwise, keep the existing scene unchanged
        return scene;
      });

      // Check if the scene was found and updated
      const sceneFound = existingProjectDoc.scenes.some(
        (scene) => scene.title.trim() === sceneTitle.trim(),
      );

      if (!sceneFound) {
        return {
          success: false,
          message: `Scene "${sceneTitle}" not found in project`,
        };
      }

      // Update only the scenes array, preserving the project name and other properties
      await FirestoreService.updateUserDocument(
        userId,
        "uploaded_data",
        existingProjectDoc.id,
        { scenes: updatedScenes },
      );

      console.log(
        "✅ [ScriptService.updateScript] Successfully updated script",
      );

      return {
        success: true,
        message: `Scene "${sceneTitle}" in project "${projectName}" updated successfully`,
      };
    } catch (error) {
      console.error("❌ [ScriptService.updateScript] Error:", error);
      return { success: false, message: (error as Error).message };
    }
  }
}
