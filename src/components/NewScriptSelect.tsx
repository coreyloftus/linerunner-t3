"use client";
import { ScriptContext, type ProjectSource } from "~/app/context";
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

  // Fetch shared projects (only if authenticated)
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

  // Get all characters for the selected project (extracted from all lines)
  const getCharacterData = () => {
    if (!selectedProject) return [];

    // Use selectedProject.source to determine which data to use
    let dataSource: ProjectJSON[];
    switch (selectedProject.source) {
      case "public":
        dataSource = publicAllData;
        break;
      case "shared":
        dataSource = sharedAllData;
        break;
      case "user":
        dataSource = userAllData;
        break;
      default:
        return [];
    }

    const project = dataSource.find(
      (p) => p.project === selectedProject.name,
    );
    // Extract unique characters from all lines across all scenes
    const characters =
      project?.scenes
        .flatMap((scene) => scene.lines.flatMap((line) => line.characters))
        .sort((a, b) => a.localeCompare(b)) ?? [];
    return Array.from(new Set(characters));
  };

  // Get scenes that contain the selected character
  const getScenesForCharacter = () => {
    if (!selectedProject || !selectedCharacter) return [];

    // Use selectedProject.source to determine which data to use
    let dataSource: ProjectJSON[];
    switch (selectedProject.source) {
      case "public":
        dataSource = publicAllData;
        break;
      case "shared":
        dataSource = sharedAllData;
        break;
      case "user":
        dataSource = userAllData;
        break;
      default:
        return [];
    }

    const project = dataSource.find(
      (p) => p.project === selectedProject.name,
    );
    return (
      project?.scenes
        .filter((scene) =>
          scene.lines.some((line) =>
            line.characters.includes(selectedCharacter),
          ),
        )
        .sort((a, b) => a.title.localeCompare(b.title)) ?? []
    );
  };

  const characterList = getCharacterData();
  const sceneList = getScenesForCharacter();

  const handleProjectChange = (compositeValue: string) => {
    const [source, ...nameParts] = compositeValue.split(':');
    const name = nameParts.join(':'); // Handle names containing colons
    setSelectedProject({ name, source: source as ProjectSource });
    // Clear dependent selections when project changes
    setSelectedCharacter("");
    setSelectedScene("");
    // Update URL with source parameter
    const newQPs = `?project=${encodeURIComponent(name)}&source=${source}`;
    router.push(newQPs);
  };

  const handleCharacterChange = (newCharacter: string) => {
    setSelectedCharacter(newCharacter);
    // Clear scene selection when character changes
    setSelectedScene("");
    const newQPs = `?project=${encodeURIComponent(selectedProject?.name ?? '')}&source=${selectedProject?.source}&character=${encodeURIComponent(newCharacter)}`;
    router.push(newQPs);
  };

  const handleSceneChange = (newScene: string) => {
    setSelectedScene(newScene);
    const newQPs = `?project=${encodeURIComponent(selectedProject?.name ?? '')}&source=${selectedProject?.source}&character=${encodeURIComponent(selectedCharacter)}&scene=${encodeURIComponent(newScene)}`;
    router.push(newQPs);
  };

  useEffect(() => {
    if (project) {
      const projectName = project.toString();
      const sourceParam = queryParams.source as ProjectSource | undefined;

      // If source is provided in URL, use it directly
      if (sourceParam && ["public", "shared", "user"].includes(sourceParam)) {
        setSelectedProject({ name: projectName, source: sourceParam });
      } else {
        // Legacy URL support: infer source by checking which list contains the project
        let inferredSource: ProjectSource = "public";
        if (publicProjects.includes(projectName)) {
          inferredSource = "public";
        } else if (sharedProjects.includes(projectName)) {
          inferredSource = "shared";
        } else if (userProjects.includes(projectName)) {
          inferredSource = "user";
        }
        setSelectedProject({ name: projectName, source: inferredSource });
      }

      if (character) {
        setSelectedCharacter(character.toString());
      }
      if (scene) {
        setSelectedScene(scene.toString());
      }
    }
  }, [
    project,
    scene,
    character,
    queryParams.source,
    publicProjects,
    sharedProjects,
    userProjects,
    setSelectedProject,
    setSelectedScene,
    setSelectedCharacter,
  ]);

  // Create composite value for Select (source:name)
  const selectedCompositeValue = selectedProject
    ? `${selectedProject.source}:${selectedProject.name}`
    : "";

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Project Selection */}
      <Select onValueChange={handleProjectChange} value={selectedCompositeValue}>
        <Label>Project</Label>
        <SelectTrigger>
          <SelectValue placeholder="Select Project">
            {selectedProject?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {hierarchicalProjects.map((project, index) => (
            <SelectItem value={`${project.type}:${project.name}`} key={index}>
              {project.type === "public"
                ? `📁 ${project.name}`
                : project.type === "shared"
                  ? `🔗 ${project.name}`
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
            <SelectValue placeholder="Select Character">
              {selectedCharacter}
            </SelectValue>
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
            <SelectValue placeholder="Select Scene">
              {selectedScene}
            </SelectValue>
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
