"use client";
import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import { ScriptContext } from "~/app/context";
import { type ProjectJSON } from "../../server/api/routers/scriptData";
import { Input } from "../ui/input";
import ControlBar from "../ControlBar";
import { CharacterLineDisplay } from "./CharacterLineDisplay";

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
  const [currentLine, setCurrentLine] = useState<string[]>([]);
  const [currentLineSplit, setCurrentLineSplit] = useState<string[]>([]);
  const [helperIndex, setHelperIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  const script = data.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  // event loop
  const proceedWithScene = useCallback(() => {
    const lines = script?.lines ?? [];
    const nextIndex = currentLineIndex + 1;
    const currentLine = lines[currentLineIndex];

    // if there are more lines to display
    if (nextIndex < lines.length) {
      // setCurrentLineIndex(nextIndex);
      if (gameMode === "navigate") {
        if (currentLine) {
          const split = currentLine.line.split(" ");
          setCurrentLineSplit(split);
          setAwaitingInput(true);
          return;
        }
      }
      if (userConfig.stopOnCharacter && gameMode === "linerun") {
        if (currentLine?.character === selectedCharacter) {
          setCurrentLine(currentLine.line.split(""));
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
    }
  }, [
    playScene,
    awaitingInput,
    proceedWithScene,
    currentLine,
    currentLineIndex,
    script,
  ]);
  useEffect(() => {
    setWordIndex(
      Math.min(0, script?.lines?.length ? script.lines.length - 1 : 0),
    );
  }, [currentLineIndex, script]);

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

  const handleLineNavigation = useCallback(
    (direction: "up" | "down") => {
      if (!playScene || !script?.lines) return;
      setAwaitingInput(false);
      const totalLines = script.lines.length;
      switch (direction) {
        case "up":
          if (currentLineIndex > 0) {
            setCurrentLineIndex((prev) => prev - 1);
            setWordIndex(0);
          }
          break;
        case "down":
          if (currentLineIndex < totalLines - 1) {
            setCurrentLineIndex((prev) => prev + 1);
            setWordIndex(0);
          } else if (currentLineIndex === totalLines - 1) {
            setCurrentLineIndex(0);
            setWordIndex(0);
          }
          break;
      }
    },
    [currentLineIndex, playScene, script?.lines],
  );

  const handleWordNavigation = useCallback(
    (direction: "left" | "right") => {
      if (!playScene) return;
      if (direction === "right" && wordIndex <= currentLineSplit.length - 1) {
        setWordIndex((prev) => prev + 1);
      } else if (direction === "left" && wordIndex > 0) {
        setWordIndex((prev) => prev - 1);
      }
    },
    [playScene, wordIndex, currentLineSplit.length],
  );
  const handleTextInput = useCallback(
    (key: string) => {
      const inputElement = document.getElementById("script-input-box");
      if (document.activeElement !== inputElement) return;

      if (
        helperIndex < currentLine.length &&
        key === currentLine[helperIndex]
      ) {
        setUserInput((prev) => prev + key);
        setHelperIndex((prev) => prev + 1);
      } else if (key === "Backspace" && helperIndex > 0) {
        setUserInput((prev) => prev.slice(0, -1));
        setHelperIndex((prev) => prev - 1);
      }
    },
    [currentLine, helperIndex],
  );

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        event.preventDefault();
      }
      switch (event.key) {
        case " ":
          if (!playScene) setPlayScene(true);
          break;
        case "ArrowDown":
          handleLineNavigation("down");
          break;
        case "ArrowUp":
          handleLineNavigation("up");
          break;
        case "ArrowRight":
          handleWordNavigation("right");
          break;
        case "ArrowLeft":
          handleWordNavigation("left");
          break;
        case "Enter":
          if (document.activeElement?.id === "script-input-box") {
            handleSubmit();
          }
          break;
        default:
          handleTextInput(event.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleSubmit,
    handleLineNavigation,
    handleWordNavigation,
    handleTextInput,
    playScene,
  ]);

  useEffect(() => {
    if (userInput === currentLine.join("")) {
      handleSubmit();
    }
  });

  useEffect(() => {
    console.log(`wordIndex: ${wordIndex}`);
  }, [wordIndex]);
  useEffect(() => {
    console.log(
      `${currentLineIndex} | ${script?.lines?.[currentLineIndex]?.character}: ${script?.lines?.[currentLineIndex]?.line}`,
    );
  }, [currentLineIndex, script]);

  return (
    <>
      <div className="mb-2 h-[80vh] max-h-[80vh] rounded-md border-2 border-[#fefefe]">
        <ul className="scrollbar-custom h-full max-h-full overflow-y-auto">
          {playScene && (
            <CharacterLineDisplay
              script={script}
              currentLineIndex={currentLineIndex}
              // currentLineSplitIndex={currentLineSplitIndex}
              scrollRef={scrollRef}
              wordIndex={wordIndex}
            />
          )}
          {/* for scrolling to bottom */}
          {/* <div ref={scrollRef}></div> */}
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
      <div className="mt-6">
        <ControlBar
          playScene={playScene}
          setPlayScene={setPlayScene}
          setCurrentLineIndex={setCurrentLineIndex}
          currentLineIndex={currentLineIndex}
          setWordDisplayIndex={setWordIndex}
          wordDisplayIndex={wordIndex}
        />
      </div>
    </>
  );
}
