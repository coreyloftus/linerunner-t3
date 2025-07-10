"use client";
import { useCallback, useContext, useEffect, useState, useRef } from "react";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
import { ScriptContext } from "~/app/context";
import { type ProjectJSON } from "../../server/api/routers/scriptData";
import ControlBar from "../ControlBar";
import { CharacterLineDisplay } from "./CharacterLineDisplay";
import { api } from "~/trpc/react";

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
    // Script playback state from context
    currentLineIndex,
    setCurrentLineIndex,
    wordIndex,
    setWordIndex,
    playScene,
    setPlayScene,
    awaitingInput,
    setAwaitingInput,
    currentLineSplit,
    setCurrentLineSplit,
  } = useContext(ScriptContext);

  // Dynamic data fetching based on data source
  const { data: dynamicData } = api.scriptData.getAll.useQuery(
    { dataSource: userConfig.dataSource },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  // Use dynamic data if available, otherwise fall back to static data
  const currentData = dynamicData ?? data;

  // Local state that doesn't need to persist across tabs
  const [userInput, setUserInput] = useState("");
  const [currentLine, setCurrentLine] = useState<string[]>([]);
  const [helperIndex, setHelperIndex] = useState(0);

  const script = currentData.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  // event loop
  const proceedWithScene = useCallback(() => {
    const lines = script?.lines ?? [];
    const nextIndex = currentLineIndex + 1;
    const currentLine = lines[currentLineIndex];

    // if there are no more lines to display
    if (nextIndex >= lines.length) {
      // Make sure the last line is properly set up for display
      if (currentLine) {
        const split = currentLine.line.split(" ");
        setCurrentLineSplit(split);
      }
      setAwaitingInput(true);
      return;
    }
    if (gameMode === "linerun") {
      if (currentLine) {
        const split = currentLine.line.split(" ");
        setCurrentLineSplit(split);
        // if not user's character, auto-advance
        if (currentLine?.character !== selectedCharacter) {
          if (userConfig.autoAdvanceScript) {
            setAwaitingInput(false);
            if (wordIndex <= split.length - 1) {
              setTimeout(() => setWordIndex((prevIndex) => prevIndex + 1), 250);
            } else {
              // All words have been advanced, move to next line
              setTimeout(() => {
                setCurrentLineIndex((prevIndex) => prevIndex + 1);
                setWordIndex(0);
              }, 50);
            }
          } else {
            setTimeout(() => {
              setCurrentLineIndex((prevIndex) => prevIndex + 1);
              setWordIndex(0);
            }, 50);
          }
        } else if (currentLine?.character === selectedCharacter) {
          setAwaitingInput(true);
        }
        return;
      }
    }
    if (gameMode === "navigate") {
      if (currentLine?.character === selectedCharacter) {
        setCurrentLine(currentLine.line.split(""));

        setAwaitingInput(true);
        return;
      }
    }
    if (userConfig.autoAdvanceScript) {
      setTimeout(() => setCurrentLineIndex((prevIndex) => prevIndex + 1), 1000);
    }
  }, [
    currentLineIndex,
    script,
    selectedCharacter,
    userConfig.autoAdvanceScript,
    gameMode,
    wordIndex,
    setCurrentLineIndex,
    setWordIndex,
    setAwaitingInput,
    setCurrentLineSplit,
  ]);

  useEffect(() => {
    if (playScene && !awaitingInput) {
      proceedWithScene();
    }
  }, [playScene, awaitingInput, proceedWithScene]);

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
  }, [
    userInput,
    currentLineIndex,
    script,
    setAwaitingInput,
    setCurrentLineIndex,
  ]);

  const handleLineNavigation = useCallback(
    (direction: "up" | "down") => {
      if (!playScene || !script?.lines) return;
      let newIndex = currentLineIndex;
      const totalLines = script.lines.length;
      if (direction === "up" && currentLineIndex > 0) {
        newIndex = currentLineIndex - 1;
      } else if (direction === "down") {
        // if not last line of scene, show next line
        if (currentLineIndex < totalLines - 1) {
          newIndex = currentLineIndex + 1;
        } else {
          // if last line of scene, show the entire line
          const lastLine = script.lines[currentLineIndex];
          if (lastLine) {
            const split = lastLine.line.split(" ");
            setCurrentLineSplit(split);
            setWordIndex(split.length);
          }
          return; // Don't continue with the rest of the function
        }
      }

      setCurrentLineIndex(newIndex);
      setCurrentLineSplit(script.lines[newIndex]?.line.split(" ") ?? []);
      setWordIndex(0);

      // Check if the new line is for the player character
      if (script.lines?.[newIndex]?.character ?? "" === selectedCharacter) {
        setAwaitingInput(true);
      } else {
        setAwaitingInput(false);
      }
    },
    [
      currentLineIndex,
      playScene,
      script?.lines,
      selectedCharacter,
      setCurrentLineIndex,
      setCurrentLineSplit,
      setWordIndex,
      setAwaitingInput,
    ],
  );
  const handleWordNavigation = useCallback(
    (direction: "left" | "right") => {
      if (!playScene) return;
      if (direction === "right" && wordIndex < currentLineSplit.length) {
        setWordIndex((prev) => prev + 1);
      } else if (direction === "left" && wordIndex > 0) {
        setWordIndex((prev) => prev - 1);
      }
    },
    [playScene, wordIndex, currentLineSplit, setWordIndex],
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
    setPlayScene,
  ]);

  useEffect(() => {
    if (userInput === currentLine.join("")) {
      handleSubmit();
    }
  });

  return (
    <div className="flex h-[90dvh] w-[80dvw] flex-col rounded-md border-2 border-stone-200">
      <div className="flex h-[90%] flex-col rounded-md ">
        <div className="pt-safe-top pb-safe-bottom flex-grow overflow-hidden">
          <ul className="overscroll-bounce h-full overflow-y-auto px-2">
            {playScene ? (
              <CharacterLineDisplay
                script={script}
                currentLineIndex={currentLineIndex}
                selectedCharacter={selectedCharacter}
                // currentLineSplitIndex={currentLineSplitIndex}
                scrollRef={scrollRef}
                wordIndex={wordIndex}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h1 className="mb-4 text-4xl font-bold text-stone-700">
                    Welcome to Line Runner
                  </h1>
                  <p className="text-lg text-stone-600">
                    Select a project, scene, and character to begin
                  </p>
                </div>
              </div>
            )}
            {/* for scrolling to bottom */}
            <div ref={scrollRef}></div>
          </ul>
        </div>

        {/* only display input box when "linerun" gameMode */}
        {/* {script && playScene && awaitingInput && gameMode === "linerun" ? (
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
        ) : null} */}
      </div>
      <div className="mt-2 h-[10%]">
        <ControlBar
          playScene={playScene}
          setPlayScene={setPlayScene}
          setCurrentLineIndex={setCurrentLineIndex}
          currentLineIndex={currentLineIndex}
          currentLineSplit={currentLineSplit}
          setWordIndex={setWordIndex}
          wordIndex={wordIndex}
          handleLineNavigation={handleLineNavigation}
          handleWordNavigation={handleWordNavigation}
        />
      </div>
    </div>
  );
}
