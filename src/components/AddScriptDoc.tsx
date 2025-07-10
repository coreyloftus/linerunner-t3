"use client";

import { useContext, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScriptContext } from "~/app/context";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";

export const AddScriptDoc = () => {
  const {
    scriptCharacterNames,
    setScriptCharacterNames,
    newScriptBox,
    setNewScriptBox,
    userConfig,
  } = useContext(ScriptContext);

  const [projectName, setProjectName] = useState("");
  const [sceneTitle, setSceneTitle] = useState("");
  const { toast } = useToast();

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

    // Call the mutation to save the script
    createScriptMutation.mutate({
      projectName: projectName.trim(),
      sceneTitle: sceneTitle.trim(),
      lines: parsedLines,
      dataSource: userConfig.dataSource,
    });
  };

  const parseScript = (script: string, characterNames: string[]) => {
    const lines = script.split(/\n/);
    const parsedLines: { character: string; line: string }[] = [];
    let currentCharacter = "";
    let currentLine = "";

    // Helper function to normalize text by removing spaces
    const normalizeText = (text: string) =>
      text.toLowerCase().replace(/\s+/g, "");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // Skip empty lines

      // Check if this line contains a character name (normalized comparison)
      const foundCharacter = characterNames.find((name) => {
        const normalizedName = normalizeText(name);
        const normalizedLine = normalizeText(trimmedLine);
        return normalizedLine.includes(normalizedName);
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
        // This line is dialogue for the current character
        if (currentCharacter) {
          currentLine += (currentLine ? " " : "") + trimmedLine;
        }
      }
    }

    // last lines
    if (currentCharacter && currentLine.trim()) {
      parsedLines.push({
        character: currentCharacter,
        line: currentLine.trim(),
      });
    }

    // console.log(parsedLines);
    return parsedLines;
  };

  return (
    <div>
      <>
        <div className="flex h-[90dvh] w-[80dvw] flex-col rounded-md border-2 border-stone-200">
          <div className="flex h-full flex-col rounded-md">
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Add Lines
              </h2>
            </div>

            {/* Project and Scene inputs */}
            <div className="flex flex-col gap-2 p-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="mb-1 text-sm text-stone-100">Project Name:</p>
                  <Input
                    placeholder="Enter project name..."
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm text-stone-100">Scene Title:</p>
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
              <p className="text-sm text-stone-100">
                Enter character names separated by commas:
              </p>
              <Input
                placeholder="Mulder, Scully, etc."
                value={scriptCharacterNames.join(", ")}
                onChange={(e) => handleAddCharacters(e)}
              />
            </div>

            {/* textarea container that takes remaining space */}
            <div className="flex-1 p-2">
              <Textarea
                value={newScriptBox}
                onChange={(e) => setNewScriptBox(e.target.value)}
                className="h-full w-full resize-none overflow-y-auto border-0 bg-transparent text-sm leading-relaxed text-stone-100 focus-visible:ring-0 dark:text-stone-100"
                placeholder="Copy/paste your raw script here..."
              />
            </div>
            <div className="p-2">
              <Button
                className="w-fit"
                variant="outline"
                onClick={() => handleAddScript(newScriptBox)}
                disabled={createScriptMutation.isPending}
              >
                {createScriptMutation.isPending ? "Saving..." : "Add Script"}
              </Button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};
