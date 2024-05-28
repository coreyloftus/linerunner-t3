import fs from "fs";
import path from "path";

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
});
