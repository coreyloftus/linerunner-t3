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
import { useRouter } from "next/navigation";
import { type ProjectJSON } from "../server/api/routers/scriptData";
import { Label } from "./ui/label";
import { api } from "~/trpc/react";

export default function NewScriptSelect({
  projects,
  allData,
}: {
  projects: string[];
  allData: ProjectJSON[];
}) {
  const router = useRouter();

  // add query params to select the project, scene, and character
  const {
    selectedProject,
    setSelectedProject,
    selectedScene,
    setSelectedScene,
    selectedCharacter,
    setSelectedCharacter,
    queryParams,
    userConfig,
  } = useContext(ScriptContext);
  const { project, scene, character } = queryParams;

  // Dynamic data fetching based on data source
  const { data: dynamicData } = api.scriptData.getAll.useQuery(
    { dataSource: userConfig.dataSource },
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Always refetch when data source changes
    },
  );

  // Use dynamic data if available, otherwise fall back to static data
  const currentProjects = dynamicData?.projects ?? projects;
  const currentAllData = dynamicData?.allData ?? allData;

  const handleProjectChange = (newProject: string) => {
    setSelectedProject(newProject);
    const newQPs = `?project=${newProject}&scene=${selectedScene}&character=${selectedCharacter}`;
    router.push(newQPs);
  };
  const handleSceneChange = (newScene: string) => {
    setSelectedScene(newScene);
    const newQPs = `?project=${selectedProject}&scene=${newScene}&character=${selectedCharacter}`;
    router.push(newQPs);
  };
  const handleCharacterChange = (newCharacter: string) => {
    setSelectedCharacter(newCharacter);
    const newQPs = `?project=${selectedProject}&scene=${selectedScene}&character=${newCharacter}`;
    router.push(newQPs);
  };

  const sceneList = selectedProject
    ? currentAllData.find((project) => project.project === selectedProject)
        ?.scenes
    : [];

  const characterList = selectedScene
    ? Array.from(
        new Set(
          currentAllData
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

  // Clear selections when data source changes
  useEffect(() => {
    setSelectedProject("");
    setSelectedScene("");
    setSelectedCharacter("");
  }, [
    userConfig.dataSource,
    setSelectedProject,
    setSelectedScene,
    setSelectedCharacter,
  ]);

  return (
    <div className="flex flex-col gap-4 px-4">
      <Select onValueChange={handleProjectChange} value={selectedProject}>
        <Label>Project</Label>
        <SelectTrigger>
          <SelectValue placeholder="Project">{selectedProject}</SelectValue>
        </SelectTrigger>
        <Label>Scene</Label>
        <SelectContent>
          {currentProjects?.map((project, index) => (
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
      <Label>Character</Label>
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
