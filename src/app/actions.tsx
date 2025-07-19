"use server";
import { api } from "~/trpc/server";

export const getAllProjects = async (
  dataSource: "local" | "firestore" | "public" = "public",
) => {
  const projects = await api.scriptData.getAll({ dataSource });
  // console.log("getAllProjects actions hit");
  // console.log(projects);
  return projects;
};

export const getScenes = async (
  project: string,
  dataSource: "local" | "firestore" = "local",
) => {
  const scenes = await api.scriptData.getScenes({ project, dataSource });
  return scenes;
};

export const getCharacters = async (
  project: string,
  scene: string,
  dataSource: "local" | "firestore" = "local",
) => {
  const characters = await api.scriptData.getCharacters({
    project,
    scene,
    dataSource,
  });
  return characters;
};
