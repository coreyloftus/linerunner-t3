"use client";

import { useContext } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScriptContext } from "~/app/context";

export const AddScriptDoc = () => {
  const {
    scriptCharacterNames,
    setScriptCharacterNames,
    newScriptBox,
    setNewScriptBox,
  } = useContext(ScriptContext);

  const handleAddCharacters = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const characterNames = e.target.value;
    const characterNamesArray = characterNames
      .split(",")
      .map((name) => name.trim());
    setScriptCharacterNames(characterNamesArray);
    console.log(characterNamesArray);
  };
  const handleAddScript = (script: string) => {
    const parsedLines = parseScript(script, scriptCharacterNames);
    console.log(parsedLines);
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

    console.log(parsedLines);
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
              <Button className="w-fit" variant="outline" type="submit">
                Add
              </Button>
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
            <Button
              className="w-fit"
              variant="outline"
              onClick={() => handleAddScript(newScriptBox)}
            >
              Add Script
            </Button>
          </div>
        </div>
      </>
    </div>
  );
};
