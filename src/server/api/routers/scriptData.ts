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
    text: string;
  }[];
}

const importAllJSON = (directory: string): ProjectJSON[] => {
  const files = fs.readdirSync(directory);
  console.log("files found");
  const jsonData = files.map((file) => {
    const data = fs.readFileSync(path.join(directory, file), "utf8");
    return JSON.parse(data) as ProjectJSON;
  });
  const flattenedData = jsonData.flat();
  console.log({ flattenedData });
  return flattenedData;
};

const allData: ProjectJSON[] = importAllJSON(
  path.resolve(__dirname, "../../../public/sceneData"),
);

export const scriptData = createTRPCRouter({
  getAll: publicProcedure.query(() => {
    console.log(allData);
    const projects = allData.map((file) => file.project);
    return {
      projects,
      allData,
    };
  }),
  getScenes: publicProcedure
    .input(z.object({ project: z.string() }))
    .query(({ input }) => {
      const scenes = allData.find(
        (file) => file.project === input.project,
      )?.scenes;
      const sceneTitles = scenes?.map((scene) => scene.title);
      return sceneTitles;
    }),
  getCharacters: publicProcedure
    .input(z.object({ project: z.string(), scene: z.string() }))
    .query(({ input }) => {
      const characters = allData
        .find((file) => file.project === input.project)
        ?.scenes.find((scene) => scene.title === input.scene)
        ?.lines.map((line) => line.character);
      return characters;
    }),
  getLines: publicProcedure
    .input(z.object({ project: z.string(), scene: z.string() }))
    .query(({ input }) => {
      const lines = allData
        .find((file) => file.project === input.project)
        ?.scenes.find((scene) => scene.title === input.scene)
        ?.lines.map((line) => line.text);
      return lines;
    }),
});
