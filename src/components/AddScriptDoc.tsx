"use client";

import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export const AddScriptDoc = () => {
  const [newScript, setNewScript] = useState("");
  const [newScriptBox, setNewScriptBox] = useState("");
  const [characterNames, setCharacterNames] = useState<string[]>([]);

  const handleAddCharacters = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const characterNames = e.target.value;
    const characterNamesArray = characterNames
      .split(",")
      .map((name) => name.trim());
    setCharacterNames(characterNamesArray);
    console.log(characterNamesArray);
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
              <form className="flex flex-col gap-2">
                <p className="text-sm text-stone-100">
                  Enter character names separated by commas:
                </p>
                <Input
                  placeholder="Mulder, Scully, etc."
                  value={characterNames.join(", ")}
                  onChange={(e) => handleAddCharacters(e)}
                />
                <Button className="w-fit" variant="outline">
                  Add
                </Button>
                <div className="flex-1">
                  <Textarea
                    value={newScriptBox}
                    onChange={(e) => setNewScriptBox(e.target.value)}
                    className="h-full min-h-[60px] resize-none border-0 bg-transparent text-sm leading-relaxed text-stone-100 focus-visible:ring-0 dark:text-stone-100"
                    placeholder="Copy/paste your raw script here..."
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};
