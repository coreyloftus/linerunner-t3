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
import { useSession } from "next-auth/react";

export default function NewScriptSelect({
  projects: _projects,
  allData: _allData,
}: {
  projects: string[];
  allData: ProjectJSON[];
}) {
  const router = useRouter();
  const { data: session } = useSession();

  // add query params to select the project, scene, and character
  const {
    selectedProject,
    setSelectedProject,
    selectedScene,
    setSelectedScene,
    selectedCharacter,
    setSelectedCharacter,
    queryParams,
  } = useContext(ScriptContext);
  const { project, scene, character } = queryParams;

  // Fetch public data (always available)
  const { data: publicData } = api.scriptData.getAll.useQuery(
    { dataSource: "public" },
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  // Fetch user data (only if authenticated)
  const { data: userData } = api.scriptData.getAll.useQuery(
    { dataSource: "firestore" },
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  // Fetch shared data (only if authenticated)
  const { data: sharedData } = api.scriptData.getAll.useQuery(
    { dataSource: "shared" },
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  // Combine public, user, and shared data
  const publicProjects = publicData?.projects ?? [];
  const publicAllData = publicData?.allData ?? [];
  const userProjects = userData?.projects ?? [];
  const userAllData = userData?.allData ?? [];
  const sharedProjects = sharedData?.projects ?? [];
  const sharedAllData = sharedData?.allData ?? [];

  // Create hierarchical project list
  const hierarchicalProjects = [
    ...publicProjects.map((project) => ({
      name: project,
      type: "public" as const,
    })),
    ...sharedProjects.map((project) => ({
      name: project,
      type: "shared" as const,
    })),
    ...userProjects.map((project) => ({
      name: project,
      type: "user" as const,
    })),
  ];

  // Determine which data source to use for scene lookup based on selected project
  const getSceneData = () => {
    if (!selectedProject) return [];

    // Check if it's a public project
    if (publicProjects.includes(selectedProject)) {
      const project = publicAllData.find(
        (project) => project.project === selectedProject,
      );
      return project?.scenes ?? [];
    }

    // Check if it's a shared project
    if (sharedProjects.includes(selectedProject)) {
      const project = sharedAllData.find(
        (project) => project.project === selectedProject,
      );
      project?.scenes.sort((a, b) => a.title.localeCompare(b.title));
      return project?.scenes ?? [];
    }

    // Check if it's a user project
    if (userProjects.includes(selectedProject)) {
      const project = userAllData.find(
        (project) => project.project === selectedProject,
      );
      project?.scenes.sort((a, b) => a.title.localeCompare(b.title));
      return project?.scenes ?? [];
    }

    return [];
  };

  const sceneList = getSceneData();

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

  // Get character list based on selected project and scene
  const getCharacterData = () => {
    if (!selectedProject || !selectedScene) return [];

    // Check if it's a public project
    if (publicProjects.includes(selectedProject)) {
      const project = publicAllData.find(
        (project) => project.project === selectedProject,
      );
      const scene = project?.scenes.find(
        (scene) => scene.title === selectedScene,
      );
      return Array.from(
        new Set(scene?.lines.map((line) => line.character) ?? []),
      );
    }

    // Check if it's a shared project
    if (sharedProjects.includes(selectedProject)) {
      const project = sharedAllData.find(
        (project) => project.project === selectedProject,
      );
      const scene = project?.scenes.find(
        (scene) => scene.title === selectedScene,
      );
      return Array.from(
        new Set(scene?.lines.map((line) => line.character) ?? []),
      );
    }

    // Check if it's a user project
    if (userProjects.includes(selectedProject)) {
      const project = userAllData.find(
        (project) => project.project === selectedProject,
      );
      const scene = project?.scenes.find(
        (scene) => scene.title === selectedScene,
      );
      return Array.from(
        new Set(scene?.lines.map((line) => line.character) ?? []),
      );
    }

    return [];
  };

  const characterList = getCharacterData();

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
    <div className="flex flex-col gap-4 px-4">
      <Select onValueChange={handleProjectChange} value={selectedProject}>
        <Label>Project</Label>
        <SelectTrigger>
          <SelectValue placeholder="Project">{selectedProject}</SelectValue>
        </SelectTrigger>
        <Label>Scene</Label>
        <SelectContent>
          {hierarchicalProjects.map((project, index) => (
            <SelectItem value={project.name} key={index}>
              {project.type === "public"
                ? `📁 ${project.name}`
                : `👤 ${project.name}`}
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
