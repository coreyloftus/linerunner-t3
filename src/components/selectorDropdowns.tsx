"use client";
import React, { useEffect } from "react";
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { SceneData } from "../app/t3/page";

interface SelectorDropsdownsProps {
  selectedProject: string;
  selectedScene: string;
  setSelectedProject: React.Dispatch<React.SetStateAction<string>>;
  scriptData: SceneData[];
  selectedChar: string;
  setSelectedScene: React.Dispatch<React.SetStateAction<string>>;
  setSelectedChar: React.Dispatch<React.SetStateAction<string>>;
}

export default function SelectorDropdowns({
  selectedProject,
  selectedScene,
  selectedChar,
  setSelectedProject,
  setSelectedScene,
  setSelectedChar,
  scriptData,
}: SelectorDropsdownsProps) {
  const getUniqueProjects = (data: SceneData[]) => {
    const projects = data.map((item) => item.project);
    return [...new Set(projects)];
  };
  const getUniqueScenes = (data: SceneData[], project: string) => {
    const scenes =
      data
        .find((item) => item.project === project)
        ?.scenes.map((scene) => scene.title) || [];
    return scenes;
  };
  const getUniqueCharacters = (data: SceneData[], scene: string) => {
    const characters =
      data
        .flatMap((item) => item.scenes)
        .find((sceneItem) => sceneItem.title === scene)
        ?.lines.map((line) => line.character) || [];
    return [...new Set(characters)];
  };

  const projectOptions = getUniqueProjects(scriptData);
  const sceneOptions = getUniqueScenes(scriptData, selectedProject);
  const characterOptions = getUniqueCharacters(scriptData, selectedScene);

  useEffect(() => {
    setSelectedScene("");
    setSelectedChar("");
  }, [selectedProject, setSelectedScene, setSelectedChar]);
  return (
    <>
      <Box
        sx={{ p: 4, display: "flex", justifyContent: "space-evenly", gap: 4 }}
      >
        <FormControl fullWidth sx={{ backgroundColor: "#f1f1f1" }}>
          <InputLabel id="project-select-label">Project</InputLabel>
          <Select
            labelId="project-select-label"
            id="project-select"
            value={selectedProject}
            label="Project"
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projectOptions.map((project) => (
              <MenuItem key={project} value={project}>
                {project}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ backgroundColor: "#f1f1f1" }}>
          <InputLabel id="scene-select-label">Scene</InputLabel>
          <Select
            labelId="scene-select-label"
            id="scene-select"
            value={selectedScene}
            label="Scene"
            onChange={(e) => setSelectedScene(e.target.value)}
          >
            {sceneOptions.map((scene) => (
              <MenuItem key={scene} value={scene}>
                {scene}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ backgroundColor: "#f1f1f1" }}>
          <InputLabel id="scene-character-label">Character</InputLabel>
          <Select
            labelId="scene-character-label"
            id="character-select"
            value={selectedChar}
            label="Character"
            onChange={(e) => setSelectedChar(e.target.value)}
          >
            {characterOptions.map((character, i) => (
              <MenuItem key={i} value={character.toString()}>
                {character}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </>
  );
}
