import fs from "fs";
import path from "path";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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
// const importAllJSON = (directory: string): ProjectJSON[] => {
//   const fullPath = path.join(process.cwd(), "public", "sceneData");
//   const files = fs.readdirSync(fullPath);
//   const jsonData = files.map((file) => {
//     const data = fs.readFileSync(path.join(directory, file), "utf8");
//     return JSON.parse(data) as ProjectJSON;
//   });
//   return jsonData.flat();
// };
const getJSONData = (): ProjectJSON[] => {
  const directory = path.join(process.cwd(), "public/sceneData");
  const files = fs.readdirSync(directory);
  return files
    .map((file) => {
      const data = fs.readFileSync(path.join(directory, file), "utf8");
      return JSON.parse(data) as ProjectJSON;
    })
    .flat();
};

// const allData: ProjectJSON[] = importAllJSON(
//   path.resolve(__dirname, "~/../public/sceneData"),
// );

export const scriptData = createTRPCRouter({
  getAll: publicProcedure.query(async (): Promise<GetAllResponse> => {
    const allData: ProjectJSON[] = getJSONData();
    const projects = allData.map((file) => file.project);
    return {
      projects,
      allData,
    };
  }),
  getScenes: publicProcedure
    .input(z.object({ project: z.string() }))
    .query(async ({ input }) => {
      const allData = getJSONData();
      const scenes = allData.find(
        (file) => file.project === input.project,
      )?.scenes;
      const sceneTitles = scenes?.map((scene) => scene.title);
      return { sceneTitles };
    }),
  getCharacters: publicProcedure
    .input(z.object({ project: z.string(), scene: z.string() }))
    .query(async ({ input }) => {
      const allData = getJSONData();
      const characters = allData
        .find((file) => file.project === input.project)
        ?.scenes.find((scene) => scene.title === input.scene)
        ?.lines.map((line) => line.character);
      return { characters };
    }),
  getLines: publicProcedure
    .input(z.object({ project: z.string(), scene: z.string() }))
    .query(({ input }) => {
      const allData = getJSONData();
      const lines = allData
        .find((file) => file.project === input.project)
        ?.scenes.find((scene) => scene.title === input.scene)
        ?.lines.map((line) => line.line);
      return lines;
    }),
});
