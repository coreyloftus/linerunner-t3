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
      const documents = await FirestoreService.getUserDocuments<ProjectJSON>(
        userId,
        "uploaded_data",
      );

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

  // Unified method to get scripts based on data source
  static async getScripts(
    dataSource: "local" | "firestore",
    userId?: string,
  ): Promise<GetAllResponse> {
    if (dataSource === "local") {
      return this.getLocalScripts();
    } else if (dataSource === "firestore" && userId) {
      return this.getFirestoreScripts(userId);
    } else {
      throw new Error("Invalid data source or missing userId for Firestore");
    }
  }

  // Get scenes for a specific project
  static async getScenes(
    project: string,
    dataSource: "local" | "firestore",
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
    dataSource: "local" | "firestore",
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
    dataSource: "local" | "firestore",
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

      return {
        success: true,
        message: `Script saved to Firestore with ID: ${documentId}`,
      };
    } catch (error) {
      console.error("Error saving Firestore script:", error);
      return { success: false, message: (error as Error).message };
    }
  }
}
