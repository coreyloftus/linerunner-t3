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
        "scripts",
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
}
