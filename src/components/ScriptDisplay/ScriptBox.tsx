"use client";
import { useCallback, useContext, useEffect, useState, useRef } from "react";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
import { ScriptContext } from "~/app/context";
import { type ProjectJSON } from "../../server/api/routers/scriptData";
import ControlBar from "../ControlBar";
import { CharacterLineDisplay } from "./CharacterLineDisplay";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

// Helper to check if user is in the line's characters (outside component for memoization)
const checkIsUserLine = (
  characters: string[] | undefined,
  selectedCharacter: string,
) => characters?.includes(selectedCharacter) ?? false;

interface ScriptBoxProps {
  data: {
    projects: string[];
    allData: ProjectJSON[];
  };
}

export default function ScriptBox({ data }: ScriptBoxProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { data: session } = useSession();
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

  // Fetch public, shared, and user data
  const { data: publicData } = api.scriptData.getAll.useQuery(
    { dataSource: "public" },
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  const { data: sharedData } = api.scriptData.getAll.useQuery(
    { dataSource: "shared" },
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  const { data: userData } = api.scriptData.getAll.useQuery(
    { dataSource: "firestore" },
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  // Determine which data to use based on selected project source
  const getCurrentData = () => {
    if (!selectedProject) return data;

    switch (selectedProject.source) {
      case "public":
        return publicData ?? data;
      case "shared":
        return sharedData ?? data;
      case "user":
        return userData ?? data;
      default:
        return data;
    }
  };

  const currentData = getCurrentData();

  // Local state that doesn't need to persist across tabs
  const [userInput, setUserInput] = useState("");
  const [currentLine, setCurrentLine] = useState<string[]>([]);
  const [helperIndex, setHelperIndex] = useState(0);

  // Reset script state when data source changes
  useEffect(() => {
    setCurrentLineIndex(0);
    setWordIndex(0);
    setPlayScene(false);
    setAwaitingInput(false);
    setCurrentLineSplit([]);
    setUserInput("");
    setHelperIndex(0);
  }, [
    userConfig.dataSource,
    setCurrentLineIndex,
    setWordIndex,
    setPlayScene,
    setAwaitingInput,
    setCurrentLineSplit,
  ]);

  const script = currentData.allData
    .find((project) => project.project === selectedProject?.name)
    ?.scenes.find((scene) => scene.title === selectedScene);

  // event loop - simplified for manual navigation only
  const proceedWithScene = useCallback(() => {
    const lines = script?.lines ?? [];
    const currentLine = lines[currentLineIndex];

    // if there are no more lines to display
    if (currentLineIndex >= lines.length) {
      setAwaitingInput(true);
      return;
    }

    if (currentLine) {
      const split = currentLine.line.split(" ");
      setCurrentLineSplit(split);
      setWordIndex(split.length); // Show full line immediately

      // Check if it's the user's line
      if (checkIsUserLine(currentLine?.characters, selectedCharacter)) {
        setAwaitingInput(true);
      } else {
        setAwaitingInput(false);
      }
    }
  }, [
    currentLineIndex,
    script,
    selectedCharacter,
    setWordIndex,
    setAwaitingInput,
    setCurrentLineSplit,
  ]);

  useEffect(() => {
    if (playScene) {
      proceedWithScene();
    }
  }, [playScene, proceedWithScene, currentLineIndex]);

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

      // Show entire line immediately
      const newLineSplit = script.lines[newIndex]?.line.split(" ") ?? [];
      setCurrentLineIndex(newIndex);
      setCurrentLineSplit(newLineSplit);
      setWordIndex(newLineSplit.length); // Show all words immediately

      // Check if the new line is for the player character
      if (checkIsUserLine(script.lines?.[newIndex]?.characters, selectedCharacter)) {
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
    <div className="flex h-[90dvh] w-[95dvw] flex-col rounded-md border-2 border-stone-200 supports-[height:100svh]:h-[90svh]">
      <div className="flex h-[90%] flex-col rounded-md ">
        <div className="pt-safe-top pb-safe-bottom flex-grow overflow-hidden">
          <ul className="overscroll-bounce h-full overflow-y-auto px-2 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain] [touch-action:pan-y]">
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
                  <div className="mb-4">
                    <h1 className="text-3xl font-bold text-stone-700">
                      Welcome to Line Runner
                    </h1>
                    <h4 className="text-lg font-bold text-stone-700">
                      by Corey
                    </h4>
                  </div>
                  <p className="text-lg text-stone-700">
                    Select a scene from the menu to begin
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
      <div className="h-[10%]">
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
