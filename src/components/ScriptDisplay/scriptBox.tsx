"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ScriptContext } from "~/app/context";

import { type ProjectJSON } from "../../server/api/routers/scriptData";

import ControlBar from "../ControlBar";
import { Input } from "../ui/input";

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
  const [helperIndex, setHelperIndex] = useState(0);

  const script = data.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  const proceedWithScene = useCallback(() => {
    const lines = script?.lines ?? [];
    const nextIndex = currentLineIndex + 1;
    const currentLine = lines[currentLineIndex];

    if (nextIndex < lines.length) {
      if (currentLine?.character === selectedCharacter) {
        setCurrentUserLine(currentLine.line.split(" "));
        console.log(`setting current user line to ${currentLine.line}`);
        setAwaitingInput(true);
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

  const handleSubmit = useCallback(() => {
    console.log("User input submitted", userInput);
    const lines = script?.lines;
    const currentLine = lines?.[currentLineIndex];
    if (userInput.trim() === currentLine?.line) {
      setAwaitingInput(false);
      setUserInput("");
      setCurrentLineIndex(currentLineIndex + 1);
      setHelperIndex(0);
    } else {
      console.log("User input does not match line -- try again");
      console.log(currentLine?.line);
    }
  }, [userInput, currentLineIndex, script]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.shiftKey &&
        event.key === " " &&
        helperIndex < currentUserLine.length
      ) {
        setUserInput(
          (prevInput) =>
            prevInput +
            (helperIndex > 0
              ? " " + currentUserLine[helperIndex]
              : currentUserLine[helperIndex]),
        );
        setHelperIndex((prevIndex) => prevIndex + 1);
      }
      if (event.shiftKey && event.key === "ArrowLeft" && helperIndex > -1) {
        setUserInput((prevInput) =>
          prevInput.split(" ").slice(0, -1).join(" "),
        );
        setHelperIndex((prevIndex) => prevIndex - 1);
      }
      if (event.key === "Enter") {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    console.log({ helperIndex, currentUserLine, userInput });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentUserLine, helperIndex, userInput, handleSubmit]);

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
      <div className="mb-2 min-h-[30vh] overflow-y-scroll rounded-md border-2 border-[#fefefe]">
        <ul className="">
          {playScene &&
            script?.lines.slice(0, currentLineIndex).map((line, index) => (
              <li
                key={index}
                className="flex flex-col justify-center gap-2 p-2"
              >
                <p className="text-xl font-bold">
                  {line.character.toUpperCase()}
                </p>
                <p className="text-xl">{line.line}</p>
              </li>
            ))}
          {playScene &&
            script?.lines
              .slice(currentLineIndex, currentLineIndex + 1)
              .map((line, index) => (
                <li
                  key={index}
                  className="flex flex-col justify-center gap-2 p-2"
                >
                  <p className="text-xl font-bold">
                    {line.character.toUpperCase()}
                  </p>
                  {line.character !== selectedCharacter && (
                    <p className="text-xl">{line.line}</p>
                  )}
                </li>
              ))}
        </ul>
        <div className="flex flex-col gap-2">
          {/* <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="..."
            className="text-white placeholder-white"
          /> */}
          {script && playScene && awaitingInput ? (
            <div className="flex">
              <Input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onClick={handleSubmit}
                className="border-0 text-[#fefefe] focus:border-0"
                placeholder="..."
              />
              <Button variant={"outline"} type="submit" onClick={handleSubmit}>
                {">"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
