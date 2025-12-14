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

  // Combine public and user data
  const publicProjects = publicData?.projects ?? [];
  const publicAllData = publicData?.allData ?? [];
  const userProjects = userData?.projects ?? [];
  const userAllData = userData?.allData ?? [];

  // Create hierarchical project list
  const hierarchicalProjects = [
    ...publicProjects.map((project) => ({
      name: project,
      type: "public" as const,
    })),
    ...userProjects.map((project) => ({
      name: project,
      type: "user" as const,
    })),
  ];

  // Get all characters for the selected project (using new characters array)
  const getCharacterData = () => {
    if (!selectedProject) return [];

    // Check if it's a public project
    if (publicProjects.includes(selectedProject)) {
      const project = publicAllData.find(
        (project) => project.project === selectedProject,
      );
      return project?.characters ?? [];
    }

    // Check if it's a user project
    if (userProjects.includes(selectedProject)) {
      const project = userAllData.find(
        (project) => project.project === selectedProject,
      );
      return project?.characters ?? [];
    }

    return [];
  };

  // Get scenes that contain the selected character
  const getScenesForCharacter = () => {
    if (!selectedProject || !selectedCharacter) return [];

    // Check if it's a public project
    if (publicProjects.includes(selectedProject)) {
      const project = publicAllData.find(
        (project) => project.project === selectedProject,
      );
      return project?.scenes.filter(scene => 
        scene.lines.some(line => line.character === selectedCharacter)
      ).sort((a, b) => a.title.localeCompare(b.title)) ?? [];
    }

    // Check if it's a user project
    if (userProjects.includes(selectedProject)) {
      const project = userAllData.find(
        (project) => project.project === selectedProject,
      );
      return project?.scenes.filter(scene => 
        scene.lines.some(line => line.character === selectedCharacter)
      ).sort((a, b) => a.title.localeCompare(b.title)) ?? [];
    }

    return [];
  };

  const characterList = getCharacterData();
  const sceneList = getScenesForCharacter();

  const handleProjectChange = (newProject: string) => {
    setSelectedProject(newProject);
    // Clear dependent selections when project changes
    setSelectedCharacter("");
    setSelectedScene("");
    const newQPs = `?project=${newProject}`;
    router.push(newQPs);
  };

  const handleCharacterChange = (newCharacter: string) => {
    setSelectedCharacter(newCharacter);
    // Clear scene selection when character changes
    setSelectedScene("");
    const newQPs = `?project=${selectedProject}&character=${newCharacter}`;
    router.push(newQPs);
  };

  const handleSceneChange = (newScene: string) => {
    setSelectedScene(newScene);
    const newQPs = `?project=${selectedProject}&character=${selectedCharacter}&scene=${newScene}`;
    router.push(newQPs);
  };


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
      {/* Project Selection */}
      <Select onValueChange={handleProjectChange} value={selectedProject}>
        <Label>Project</Label>
        <SelectTrigger>
          <SelectValue placeholder="Select Project">{selectedProject}</SelectValue>
        </SelectTrigger>
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

      {/* Character Selection - only show if project is selected */}
      {selectedProject && (
        <Select 
          onValueChange={handleCharacterChange} 
          value={selectedCharacter}
          disabled={!selectedProject}
        >
          <Label>Character</Label>
          <SelectTrigger>
            <SelectValue placeholder="Select Character">{selectedCharacter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {characterList?.map((char, index) => (
              <SelectItem value={char} key={index}>
                {char}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Scene Selection - only show if character is selected */}
      {selectedProject && selectedCharacter && (
        <Select 
          onValueChange={handleSceneChange} 
          value={selectedScene}
          disabled={!selectedCharacter}
        >
          <Label>Scene</Label>
          <SelectTrigger>
            <SelectValue placeholder="Select Scene">{selectedScene}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sceneList?.map((scene, index) => (
              <SelectItem value={scene.title} key={index}>
                {scene.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
