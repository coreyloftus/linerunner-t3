"use client";
import { ScriptContext } from "~/app/context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useContext, useEffect } from "react";

import { type ProjectJSON } from "../server/api/routers/scriptData";
import { useSearchParams } from "next/navigation";

export default function NewScriptSelect({
  projects,
  allData,
}: {
  projects: string[];
  allData: ProjectJSON[];
}) {
  // add query params to select the project, scene, and character

  const searchParams = useSearchParams();
  const project = searchParams.get("project");
  const scene = searchParams.get("scene");
  const character = searchParams.get("character");

  const {
    selectedProject,
    setSelectedProject,
    selectedScene,
    setSelectedScene,
    selectedCharacter,
    setSelectedCharacter,
  } = useContext(ScriptContext);

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
  };
  const handleSceneChange = (value: string) => {
    setSelectedScene(value);
  };
  const handleCharacterChange = (value: string) => {
    setSelectedCharacter(value);
  };

  const sceneList = selectedProject
    ? allData.find((project) => project.project === selectedProject)?.scenes
    : [];

  const characterList = selectedScene
    ? Array.from(
        new Set(
          allData
            .find((project) => project.project === selectedProject)
            ?.scenes.find((scene) => scene.title === selectedScene)
            ?.lines.map((line) => line.character),
        ),
      )
    : [];

  useEffect(() => {
    if (project) {
      setSelectedProject(project.toString());
      if (scene) {
        setSelectedScene(scene.toString());
        if (character) {
          setSelectedCharacter(character.toString());
        }
      }
    }
  }, [
    project,
    scene,
    character,
    setSelectedProject,
    setSelectedScene,
    setSelectedCharacter,
  ]);

  return (
    <div className="flex gap-4">
      <Select onValueChange={handleProjectChange} value={selectedProject}>
        <SelectTrigger>
          <SelectValue placeholder="Project">{selectedProject}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {projects?.map((project, index) => (
            <SelectItem value={project.toString()} key={index}>
              {project}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={handleSceneChange} value={selectedScene}>
        <SelectTrigger>
          <SelectValue placeholder="Scene">{selectedScene}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sceneList?.map((scene, index) => (
            <SelectItem value={scene.title} key={index}>
              {scene.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={handleCharacterChange} value={selectedCharacter}>
        <SelectTrigger>
          <SelectValue placeholder="Character">{selectedCharacter}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {characterList?.map((char, index) => (
            <SelectItem value={char} key={index}>
              {char}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
