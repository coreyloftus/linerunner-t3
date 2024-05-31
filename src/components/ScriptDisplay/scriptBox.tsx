"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ScriptContext } from "~/app/context";

import { type ProjectJSON } from "../../server/api/routers/scriptData";

import ControlBar from "../ControlBar";

interface ScriptBoxProps {
  data: {
    projects: string[];
    allData: ProjectJSON[];
  };
}
export default function ScriptBox({ data }: ScriptBoxProps) {
  const { selectedProject, selectedScene, selectedCharacter } =
    useContext(ScriptContext);
  const [playScene, setPlayScene] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [currentUserLine, setCurrentUserLine] = useState<string[]>([]);

  const script = data.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  const proceedWithScene = useCallback(() => {
    const lines = script?.lines ?? [];
    const nextIndex = currentLineIndex + 1;
    const currentLine = lines[currentLineIndex];

    if (currentLine?.character == selectedCharacter) {
      setAwaitingInput(true);
      setCurrentUserLine(currentLine.line.split(" "));
      return;
    }
    if (nextIndex < lines.length) {
      const nextLine = lines[currentLineIndex + 1];
      if (nextLine?.character === selectedCharacter) {
        setAwaitingInput(true);
        setCurrentUserLine(nextLine.line.split(" "));
        console.log(`setting current user line to ${nextLine.line}`);
        return;
      } else {
        setTimeout(
          () => setCurrentLineIndex((prevIndex) => prevIndex + 1),
          1000,
        );
      }
    } else {
      setPlayScene(false);
    }
  }, [currentLineIndex, script, selectedCharacter]);

  useEffect(() => {
    console.log({ currentUserLine });
    if (playScene && !awaitingInput) {
      proceedWithScene();
      console.log(
        `${currentLineIndex} | ${script?.lines?.[currentLineIndex]?.character}: ${script?.lines?.[currentLineIndex]?.line}`,
      );
    }
  }, [
    playScene,
    awaitingInput,
    proceedWithScene,
    currentUserLine,
    currentLineIndex,
    script,
  ]);

  const handleSubmit = () => {
    console.log("User input submitted", userInput);
    const lines = script?.lines;
    const nextLine = lines?.[currentLineIndex + 1];
    if (userInput.trim() === nextLine?.line) {
      setAwaitingInput(false);
      setUserInput("");
      setCurrentLineIndex(currentLineIndex + 1);
    } else {
      console.log("User input does not match line -- try again");
      console.log(nextLine?.line);
    }
  };

  return (
    <>
      <div className="m-2">
        <ControlBar
          playScene={playScene}
          setPlayScene={setPlayScene}
          setCurrentLineIndex={setCurrentLineIndex}
          currentLineIndex={currentLineIndex}
        />
      </div>
      <div className="mb-2 min-h-[30vh] overflow-y-scroll rounded-md border-2 border-zinc-400">
        <ul className="">
          {playScene &&
            script?.lines.slice(0, currentLineIndex + 1).map((lines, index) => (
              <li
                key={index}
                className="flex flex-col justify-center gap-2 p-2"
              >
                <p className="font-bold">{lines.character.toUpperCase()}</p>
                <p className="text-gray-600">{lines.line}</p>
              </li>
            ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Your line..."
          className="text-white placeholder-white"
        />
        <div className="">
          <Button
            variant="outline"
            onClick={handleSubmit}
            className="text-[#010101]"
          >
            Submit
          </Button>
        </div>
      </div>
    </>
  );
}
