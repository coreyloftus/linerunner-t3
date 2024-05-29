"use server";
import { api } from "~/trpc/server";

export const getAllProjects = async () => {
  const projects = await api.scriptData.getAll();
  console.log("getAllProjects actions hit");
  console.log(projects);
  return projects;
};

export const getScenes = async (project: string) => {
  const scenes = await api.scriptData.getScenes({ project });
  return scenes;
};
export const getCharacters = async (project: string, scene: string) => {
  const characters = await api.scriptData.getCharacters({ project, scene });
  return characters;
};
