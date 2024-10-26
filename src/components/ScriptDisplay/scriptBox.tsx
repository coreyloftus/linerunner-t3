"use client";
import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";

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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const {
    selectedProject,
    selectedScene,
    selectedCharacter,
    userConfig,
    gameMode,
  } = useContext(ScriptContext);
  const [playScene, setPlayScene] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [currentUserLine, setCurrentUserLine] = useState<string[]>([]);
  const [helperIndex, setHelperIndex] = useState(0);

  const script = data.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  // event loop
  const proceedWithScene = useCallback(() => {
    const lines = script?.lines ?? [];
    const nextIndex = currentLineIndex + 1;
    const currentLine = lines[currentLineIndex];
    console.log(`gameMode: ${gameMode}`);

    // if there are more lines to display
    if (nextIndex < lines.length) {
      if (gameMode === "navigate") {
        console.log(`in navigate mode`);
        if (currentLine?.character) {
          setCurrentUserLine(currentLine.line.split(""));
          console.log(`setting current user line to ${currentLine.line}`);
          setAwaitingInput(true);
          return;
        }
      }
      if (userConfig.stopOnCharacter && gameMode === "linerun") {
        if (currentLine?.character === selectedCharacter) {
          setCurrentUserLine(currentLine.line.split(""));
          console.log(`setting current user line to ${currentLine.line}`);
          setAwaitingInput(true);
          return;
        }
      }
      if (userConfig.autoAdvanceScript) {
        setTimeout(
          () => setCurrentLineIndex((prevIndex) => prevIndex + 1),
          1000,
        );
      }
    } else {
      setPlayScene(false);
    }
  }, [
    currentLineIndex,
    script,
    selectedCharacter,
    userConfig.autoAdvanceScript,
    userConfig.stopOnCharacter,
    gameMode,
  ]);

  useEffect(() => {
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [script?.lines, currentLineIndex]);

  // "linerun" mode -- handle user input
  const handleSubmit = useCallback(() => {
    const lines = script?.lines;
    const currentLine = lines?.[currentLineIndex];
    if (userInput.trim() === currentLine?.line) {
      setAwaitingInput(false);
      setUserInput("");
      setCurrentLineIndex(currentLineIndex + 1);
      setHelperIndex(0);
    }
  }, [userInput, currentLineIndex, script]);

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const inputElement = document.getElementById("script-input-box");
      if (activeElement === inputElement) {
        if (
          helperIndex < currentUserLine.length &&
          event.key === currentUserLine[helperIndex]
        ) {
          setUserInput((prevInput) => prevInput + currentUserLine[helperIndex]);
          setHelperIndex((prevIndex) => prevIndex + 1);
        }
        if (event.key === "Backspace" && helperIndex > 0) {
          setUserInput((prevInput) => prevInput.slice(0, -1));
          setHelperIndex((prevIndex) => prevIndex - 1);
        }
        if (event.key === "Enter") {
          handleSubmit();
        }
        console.log({ helperIndex, currentUserLine, userInput });
      } else {
        if (event.key === " " && !playScene) {
          setPlayScene(true);
        }
        if (event.key === "ArrowDown" && playScene) {
          setCurrentLineIndex(currentLineIndex + 1);
        }
        if (event.key === "ArrowUp" && playScene) {
          if (currentLineIndex > 0) setCurrentLineIndex(currentLineIndex - 1);
        }
        if (event.key === "ArrowRight" && playScene) {
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentUserLine,
    helperIndex,
    userInput,
    handleSubmit,
    playScene,
    currentLineIndex,
  ]);

  useEffect(() => {
    if (userInput === currentUserLine.join("")) {
      handleSubmit();
    }
  });

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
      <div className="mb-2 h-[80vh] max-h-[80vh] rounded-md border-2 border-[#fefefe]">
        <ul className="scrollbar-custom h-full max-h-full overflow-y-auto">
          {/* user char + lines */}
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
          {/* NPC lines */}
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
                  {gameMode === "linerun" &&
                    line.character !== selectedCharacter && (
                      <p className="text-xl">{line.line}</p>
                    )}
                  {gameMode === "navigate" && (
                    <p className="text-xl">{line.line}</p>
                  )}
                </li>
              ))}
          {/* for scrolling to bottom */}
          <div ref={scrollRef}></div>
        </ul>

        {/* only display input box when "linerun" gameMode */}
        {script && playScene && awaitingInput && gameMode === "linerun" ? (
          <div className="flex flex-col gap-2">
            <div className="flex">
              <Input
                id="script-input-box"
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onClick={handleSubmit}
                className="h-10 w-full border-0 bg-transparent text-xl text-[#fefefe] focus:border-0 focus:border-transparent focus:shadow-none focus:shadow-transparent focus:outline-none focus:outline-transparent focus:ring-0 focus:ring-transparent focus:ring-offset-0 focus:ring-offset-transparent"
                placeholder="..."
              />
              <Button variant={"outline"} type="submit" onClick={handleSubmit}>
                {">"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
