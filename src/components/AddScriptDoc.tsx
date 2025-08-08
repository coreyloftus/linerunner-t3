"use client";

import { useContext, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScriptContext } from "~/app/context";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useSession } from "next-auth/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export const AddScriptDoc = () => {
  const { data: session } = useSession();
  const {
    scriptCharacterNames,
    setScriptCharacterNames,
    newScriptBox,
    setNewScriptBox,
    userConfig,
    isAdmin,
  } = useContext(ScriptContext);

  const [projectName, setProjectName] = useState("");
  const [sceneTitle, setSceneTitle] = useState("");
  const [isNewProject, setIsNewProject] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedSubcollection, setSelectedSubcollection] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { toast } = useToast();

  // Fetch existing projects from public data
  const { data: publicData, isLoading: isLoadingPublicProjects } =
    api.scriptData.getAll.useQuery(
      { dataSource: "public" },
      {
        enabled: true,
      },
    );

  // Fetch existing projects from user data
  const { data: userData, isLoading: isLoadingUserProjects } =
    api.scriptData.getAll.useQuery(
      { dataSource: "firestore" },
      {
        enabled: !!session?.user,
      },
    );

  // Fetch collections for admin mode
  const { data: collectionsData, isLoading: isLoadingCollections } =
    api.firebase.getCollections.useQuery(
      { adminEmail: session?.user?.email ?? "" },
      {
        enabled: !!session?.user && isAdmin && isAdminMode,
      },
    );

  // Fetch subcollections for selected collection
  const { data: subcollectionsData, isLoading: isLoadingSubcollections } =
    api.firebase.getSubcollections.useQuery(
      {
        collectionName: selectedCollection,
        adminEmail: session?.user?.email ?? "",
      },
      {
        enabled:
          !!session?.user && isAdmin && isAdminMode && !!selectedCollection,
      },
    );

  // Fetch document IDs for selected collection
  const { data: documentIdsData, isLoading: isLoadingDocumentIds } =
    api.firebase.getDocumentIds.useQuery(
      {
        collectionName: selectedCollection,
        adminEmail: session?.user?.email ?? "",
      },
      {
        enabled:
          !!session?.user && isAdmin && isAdminMode && !!selectedCollection,
      },
    );

  const createScriptMutation = api.scriptData.createScript.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: data.message,
        });
        // Clear the form
        setProjectName("");
        setSceneTitle("");
        setNewScriptBox("");
        setScriptCharacterNames([]);
        setIsNewProject(false);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAdminScriptMutation =
    api.scriptData.createAdminScript.useMutation({
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: "Success!",
            description: data.message,
          });
          // Clear the form
          setProjectName("");
          setSceneTitle("");
          setNewScriptBox("");
          setScriptCharacterNames([]);
          setIsNewProject(false);
          setSelectedCollection("");
          setSelectedDocumentId("");
          setSelectedSubcollection("");
          setIsAdminMode(false);
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  const handleAddCharacters = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const characterNames = e.target.value;
    const characterNamesArray = characterNames
      .split(",")
      .map((name) => name.trim());
    setScriptCharacterNames(characterNamesArray);
    // console.log(characterNamesArray);
  };

  const handleProjectChange = (value: string) => {
    if (value === "new") {
      setIsNewProject(true);
      setProjectName("");
    } else {
      setIsNewProject(false);
      // Remove the icon prefix if present
      const cleanProjectName = value.replace(/^[👤📁]\s*/, "");
      setProjectName(cleanProjectName);
    }
  };

  const handleAddScript = (script: string) => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    if (!sceneTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scene title",
        variant: "destructive",
      });
      return;
    }

    if (scriptCharacterNames.length === 0) {
      toast({
        title: "Error",
        description: "Please enter character names",
        variant: "destructive",
      });
      return;
    }

    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter script content",
        variant: "destructive",
      });
      return;
    }

    const parsedLines = parseScript(script, scriptCharacterNames);

    if (parsedLines.length === 0) {
      toast({
        title: "Error",
        description:
          "No valid lines found. Please check your script format and character names.",
        variant: "destructive",
      });
      return;
    }

    // Determine data source based on selected project
    const userProjects = userData?.projects ?? [];
    const publicProjects = publicData?.projects ?? [];
    const isUserProject = userProjects.includes(projectName.trim());
    const isPublicProject = publicProjects.includes(projectName.trim());

    // Use admin mutation if in admin mode
    if (isAdminMode) {
      if (
        !selectedCollection ||
        !selectedDocumentId ||
        !selectedSubcollection
      ) {
        toast({
          title: "Error",
          description:
            "Please select collection, document ID, and subcollection",
          variant: "destructive",
        });
        return;
      }

      createAdminScriptMutation.mutate({
        projectName: projectName.trim(),
        sceneTitle: sceneTitle.trim(),
        lines: parsedLines,
        collectionName: selectedCollection,
        documentId: selectedDocumentId,
        subcollectionName: selectedSubcollection,
        adminEmail: session?.user?.email ?? "",
      });
    } else {
      // Determine data source based on project type
      let dataSource: "firestore" | "public" = "firestore";

      if (isPublicProject) {
        // Only allow adding to public projects in admin mode
        toast({
          title: "Error",
          description: "You can only add to public projects in admin mode",
          variant: "destructive",
        });
        return;
      } else if (isUserProject) {
        dataSource = "firestore";
      } else {
        // New project - default to firestore
        dataSource = "firestore";
      }

      createScriptMutation.mutate({
        projectName: projectName.trim(),
        sceneTitle: sceneTitle.trim(),
        lines: parsedLines,
        dataSource: dataSource,
      });
    }
  };

  const parseScript = (script: string, characterNames: string[]) => {
    const lines = script.split(/\n/);
    const parsedLines: { character: string; line: string; sung?: boolean }[] =
      [];
    let currentCharacter = "";
    let currentLine = "";

    // Helper function to normalize text by removing spaces
    const normalizeText = (text: string) =>
      text.toLowerCase().replace(/\s+/g, "");

    // Helper function to check if a line is sung (all caps)
    const isSungLine = (text: string) => {
      // Remove spaces and punctuation, check if all remaining characters are uppercase
      const cleanedText = text.replace(/[^a-zA-Z]/g, "");
      return (
        cleanedText.length > 0 && cleanedText === cleanedText.toUpperCase()
      );
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // Skip empty lines

      // First check if this is a sung line (all caps) - but exclude simple character names
      const isCharacterNameOnly = characterNames.some((name) => {
        const normalizedName = normalizeText(name);
        const normalizedLine = normalizeText(trimmedLine);
        return (
          normalizedLine === normalizedName ||
          normalizedLine === normalizedName + ":" ||
          normalizedLine.replace(/[^a-z]/g, "") === normalizedName
        );
      });

      if (!isCharacterNameOnly && isSungLine(trimmedLine)) {
        // If we have a previous character and line, save it first
        if (currentCharacter && currentLine.trim()) {
          parsedLines.push({
            character: currentCharacter,
            line: currentLine.trim(),
          });
        }
        // Add the sung line as a separate line object
        if (currentCharacter) {
          parsedLines.push({
            character: currentCharacter,
            line: trimmedLine,
            sung: true,
          });
        }
        currentLine = "";
      } else {
        // Check if this line is a character name (should be at the start of the line)
        const foundCharacter = characterNames.find((name) => {
          const normalizedName = normalizeText(name);
          const normalizedLine = normalizeText(trimmedLine);
          // Check if line starts with character name or is exactly the character name
          return (
            normalizedLine === normalizedName ||
            normalizedLine.startsWith(normalizedName + ":") ||
            normalizedLine.startsWith(normalizedName + " ")
          );
        });

        if (foundCharacter) {
          // If we have a previous character and line, save it
          if (currentCharacter && currentLine.trim()) {
            parsedLines.push({
              character: currentCharacter,
              line: currentLine.trim(),
            });
          }
          // Start new character
          currentCharacter = foundCharacter;
          currentLine = "";
        } else {
          // This line is regular dialogue for the current character
          if (currentCharacter) {
            currentLine += (currentLine ? " " : "") + trimmedLine;
          }
        }
      }
    }

    // Save the last lines
    if (currentCharacter && currentLine.trim()) {
      parsedLines.push({
        character: currentCharacter,
        line: currentLine.trim(),
      });
    }

    // console.log(parsedLines);
    return parsedLines;
  };

  // If user is not authenticated, show message
  if (!session?.user) {
    return (
      <div className="flex h-[90dvh] w-[80dvw] flex-col items-center justify-center rounded-md border-2 border-stone-200">
        <div className="text-center">
          <h2 className="mb-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
            Authentication Required
          </h2>
          <p className="text-stone-600 dark:text-stone-400">
            Please sign in to add scripts to the database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <>
        <div className="flex h-[90dvh] w-[90dvw] flex-col rounded-md border-2 border-stone-200">
          <div className="flex h-full flex-col rounded-md">
            <div className="flex items-center justify-between rounded-md border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Add Script
                </h2>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-stone-700 dark:text-stone-300">
                    Admin Mode:
                  </label>
                  <input
                    type="checkbox"
                    checked={isAdminMode}
                    onChange={(e) => setIsAdminMode(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                </div>
              )}
            </div>

            {/* Admin Mode Configuration */}
            {isAdmin && isAdminMode && (
              <div className="flex flex-col gap-2 border-b border-stone-200 p-2">
                <p className="text-sm font-semibold text-stone-100">
                  Admin Configuration:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="mb-1 text-xs text-stone-100">Collection:</p>
                    <Select
                      onValueChange={setSelectedCollection}
                      value={selectedCollection}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select collection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {collectionsData?.data?.map((collection) => (
                          <SelectItem key={collection} value={collection}>
                            {collection}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-stone-100">Document ID:</p>
                    <Select
                      onValueChange={setSelectedDocumentId}
                      value={selectedDocumentId}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select document ID..." />
                      </SelectTrigger>
                      <SelectContent>
                        {documentIdsData?.data?.map((documentId) => (
                          <SelectItem key={documentId} value={documentId}>
                            {documentId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-stone-100">
                      Subcollection:
                    </p>
                    <Select
                      onValueChange={setSelectedSubcollection}
                      value={selectedSubcollection}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select subcollection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subcollectionsData?.data?.map((subcollection) => (
                          <SelectItem key={subcollection} value={subcollection}>
                            {subcollection}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Project and Scene inputs */}
            <div className="flex flex-col gap-2 p-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <p className="mb-1 text-sm text-stone-900 dark:text-stone-100">
                    Project Name:
                  </p>
                  <div className="space-y-2">
                    <Select
                      onValueChange={handleProjectChange}
                      value={isNewProject ? "new" : projectName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing project or add new..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show user projects (always available to user) */}
                        {userData?.projects.map((project) => (
                          <SelectItem key={project} value={project}>
                            👤 {project}
                          </SelectItem>
                        ))}
                        {/* Show public projects only in admin mode */}
                        {isAdminMode &&
                          publicData?.projects.map((project) => (
                            <SelectItem key={project} value={project}>
                              📁 {project}
                            </SelectItem>
                          ))}
                        <SelectItem value="new">+ Add New Project</SelectItem>
                      </SelectContent>
                    </Select>
                    {isNewProject && (
                      <Input
                        placeholder="Enter new project name..."
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm text-stone-900 dark:text-stone-100">
                    Scene Title:
                  </p>
                  <Input
                    placeholder="Enter scene title..."
                    value={sceneTitle}
                    onChange={(e) => setSceneTitle(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* inputs for character names */}
            <div className="flex flex-col gap-2 p-2">
              <p className="text-sm text-stone-900 dark:text-stone-100">
                Character names separated by commas:
              </p>
              <Input
                placeholder="Rosenkrantz, Guildenstern, etc."
                value={scriptCharacterNames.join(", ")}
                onChange={(e) => handleAddCharacters(e)}
              />
            </div>

            {/* textarea container that takes remaining space */}
            <div className="flex-1 p-2">
              <Textarea
                value={newScriptBox}
                onChange={(e) => setNewScriptBox(e.target.value)}
                className="h-full w-full resize-none overflow-y-auto border-0 bg-transparent text-sm leading-relaxed text-stone-900 focus-visible:ring-0 dark:text-stone-100"
                placeholder={`Copy/paste your raw script here.

Character names should be in all caps.
Ex: 
STANLEY
Stella!!!

Sung lines should be in all caps between two character names.
Ex:
MARIA
THE HILLS ARE ALIVE WITH THE SOUND OF MUSIC
WITH SONGS THEY HAVE SUNG FOR A THOUSAND YEARS
`}
              />
            </div>
            <div className="p-2">
              <Button
                className="w-fit"
                variant="outline"
                onClick={() => handleAddScript(newScriptBox)}
                disabled={
                  createScriptMutation.isPending ||
                  createAdminScriptMutation.isPending ||
                  isLoadingUserProjects ||
                  (isAdminMode &&
                    (isLoadingCollections ||
                      isLoadingSubcollections ||
                      isLoadingDocumentIds))
                }
              >
                {createScriptMutation.isPending ||
                createAdminScriptMutation.isPending
                  ? "Saving..."
                  : "Add Script"}
              </Button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};
