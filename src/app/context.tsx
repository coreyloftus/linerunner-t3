"use client";
import React, {
  createContext,
  type Dispatch,
  type SetStateAction,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import { type GetAllResponse } from "~/server/api/routers/scriptData";

interface ScriptContextProps {
  selectedProject: string;
  setSelectedProject: Dispatch<SetStateAction<string>>;
  selectedScene: string;
  setSelectedScene: Dispatch<SetStateAction<string>>;
  selectedCharacter: string;
  setSelectedCharacter: Dispatch<SetStateAction<string>>;
  userConfig: UserConfig;
  setUserConfig: Dispatch<SetStateAction<UserConfig>>;
  gameMode: "navigate" | "linerun";
  setGameMode: Dispatch<SetStateAction<"navigate" | "linerun">>;
  queryParams: Record<string, string>;
  setQueryParams: Dispatch<SetStateAction<Record<string, string>>>;
  allProjects: GetAllResponse;
  setAllProjects: Dispatch<SetStateAction<GetAllResponse>>;
  // Script playback state
  currentLineIndex: number;
  setCurrentLineIndex: Dispatch<SetStateAction<number>>;
  wordIndex: number;
  setWordIndex: Dispatch<SetStateAction<number>>;
  playScene: boolean;
  setPlayScene: Dispatch<SetStateAction<boolean>>;
  awaitingInput: boolean;
  setAwaitingInput: Dispatch<SetStateAction<boolean>>;
  currentLineSplit: string[];
  setCurrentLineSplit: Dispatch<SetStateAction<string[]>>;
  // Script creation state
  scriptCharacterNames: string[];
  setScriptCharacterNames: Dispatch<SetStateAction<string[]>>;
  newScriptBox: string;
  setNewScriptBox: Dispatch<SetStateAction<string>>;
}

type UserConfig = {
  stopOnCharacter: boolean;
  autoAdvanceScript: boolean;
};

// Create the context with default values
export const ScriptContext = createContext<ScriptContextProps>({
  selectedProject: "",
  setSelectedProject: () => "",
  selectedScene: "",
  setSelectedScene: () => "",
  selectedCharacter: "",
  setSelectedCharacter: () => "",
  userConfig: { stopOnCharacter: true, autoAdvanceScript: true },
  gameMode: "linerun",
  setUserConfig: () => ({ stopOnCharacter: true, autoAdvanceScript: false }),
  setGameMode: () => "linerun",
  queryParams: {},
  setQueryParams: () => ({}),
  allProjects: { projects: [], allData: [] },
  setAllProjects: () => ({ projects: [], allData: [] }),
  // Script playback state defaults
  currentLineIndex: 0,
  setCurrentLineIndex: () => 0,
  wordIndex: 0,
  setWordIndex: () => 0,
  playScene: false,
  setPlayScene: () => false,
  awaitingInput: false,
  setAwaitingInput: () => false,
  currentLineSplit: [],
  setCurrentLineSplit: () => [],
  // Script creation state defaults
  scriptCharacterNames: [],
  setScriptCharacterNames: () => [],
  newScriptBox: "",
  setNewScriptBox: () => "",
});

export const ScriptProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [userConfig, setUserConfig] = useState<UserConfig>({
    stopOnCharacter: true,
    autoAdvanceScript: true,
  });
  const [gameMode, setGameMode] = useState<"navigate" | "linerun">("linerun");
  const [queryParams, setQueryParams] = useState({});
  const searchParams = useSearchParams();
  const [allProjects, setAllProjects] = useState<GetAllResponse>({
    projects: [],
    allData: [],
  });

  // Script playback state
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [playScene, setPlayScene] = useState<boolean>(false);
  const [awaitingInput, setAwaitingInput] = useState<boolean>(false);
  const [currentLineSplit, setCurrentLineSplit] = useState<string[]>([]);

  // Script creation state
  const [scriptCharacterNames, setScriptCharacterNames] = useState<string[]>(
    [],
  );
  const [newScriptBox, setNewScriptBox] = useState<string>("");

  useEffect(() => {
    setQueryParams(Object.fromEntries(searchParams));
  }, [searchParams]);

  return (
    <ScriptContext.Provider
      value={{
        selectedProject,
        setSelectedProject,
        selectedScene,
        setSelectedScene,
        selectedCharacter,
        setSelectedCharacter,
        setUserConfig,
        userConfig,
        gameMode,
        setGameMode,
        queryParams,
        setQueryParams,
        allProjects,
        setAllProjects,
        // Script playback state
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
        // Script creation state
        scriptCharacterNames,
        setScriptCharacterNames,
        newScriptBox,
        setNewScriptBox,
      }}
    >
      {children}
    </ScriptContext.Provider>
  );
};
