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
  // Theme state
  theme: "light" | "dark";
  setTheme: Dispatch<SetStateAction<"light" | "dark">>;
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
  isAdmin: boolean;
  setIsAdmin: Dispatch<SetStateAction<boolean>>;
  // Display preferences
  displayPreferences: DisplayPreferences;
  setDisplayPreferences: Dispatch<SetStateAction<DisplayPreferences>>;
}

type UserConfig = {
  stopOnCharacter: boolean;
  dataSource: "local" | "firestore" | "public" | "shared";
};

// Color presets for line styling
export type ColorPreset =
  | "default"
  | "violet-400"
  | "blue-400"
  | "emerald-400"
  | "rose-400"
  | "amber-400"
  | "cyan-400"
  | "stone-400";

// Display preferences for customizing script appearance
export interface DisplayPreferences {
  ownCharacterColor: ColorPreset;
  otherCharacterColor: ColorPreset;
  sharedLineColor: ColorPreset;
  fontSize: number; // percentage: 75-125
}

const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  ownCharacterColor: "default",
  otherCharacterColor: "default",
  sharedLineColor: "violet-400",
  fontSize: 100,
};

// Create the context with default values
export const ScriptContext = createContext<ScriptContextProps>({
  selectedProject: "",
  setSelectedProject: () => "",
  selectedScene: "",
  setSelectedScene: () => "",
  selectedCharacter: "",
  setSelectedCharacter: () => "",
  userConfig: {
    stopOnCharacter: true,
    dataSource: "public",
  },
  gameMode: "linerun",
  setUserConfig: () => ({
    stopOnCharacter: true,
    dataSource: "public",
  }),
  setGameMode: () => "linerun",
  queryParams: {},
  setQueryParams: () => ({}),
  allProjects: { projects: [], allData: [] },
  setAllProjects: () => ({ projects: [], allData: [] }),
  // Theme defaults
  theme: "light",
  setTheme: () => "light",
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
  isAdmin: false,
  setIsAdmin: () => false,
  // Display preferences defaults
  displayPreferences: DEFAULT_DISPLAY_PREFERENCES,
  setDisplayPreferences: () => DEFAULT_DISPLAY_PREFERENCES,
});

export const ScriptProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [userConfig, setUserConfig] = useState<UserConfig>({
    stopOnCharacter: true,
    dataSource: "public",
  });
  const [gameMode, setGameMode] = useState<"navigate" | "linerun">("linerun");
  const [queryParams, setQueryParams] = useState({});
  const searchParams = useSearchParams();
  const [allProjects, setAllProjects] = useState<GetAllResponse>({
    projects: [],
    allData: [],
  });

  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("linerunner-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
      // Default to system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Display preferences state with localStorage persistence
  const [displayPreferences, setDisplayPreferences] =
    useState<DisplayPreferences>(() => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("linerunner-display-preferences");
        if (saved) {
          try {
            return JSON.parse(saved) as DisplayPreferences;
          } catch {
            return DEFAULT_DISPLAY_PREFERENCES;
          }
        }
      }
      return DEFAULT_DISPLAY_PREFERENCES;
    });

  useEffect(() => {
    setQueryParams(Object.fromEntries(searchParams));
  }, [searchParams]);

  // Persist theme changes to localStorage and apply to document
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("linerunner-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  // Persist display preferences to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "linerunner-display-preferences",
        JSON.stringify(displayPreferences),
      );
    }
  }, [displayPreferences]);

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
        // Theme state
        theme,
        setTheme,
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
        isAdmin,
        setIsAdmin,
        // Display preferences
        displayPreferences,
        setDisplayPreferences,
      }}
    >
      {children}
    </ScriptContext.Provider>
  );
};
