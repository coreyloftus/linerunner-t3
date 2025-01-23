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
  setUserConfig: () => ({ stopOnCharacter: true, autoAdvanceScript: true }),
  setGameMode: () => "linerun",
  queryParams: {},
  setQueryParams: () => ({}),
  allProjects: { projects: [], allData: [] },
  setAllProjects: () => ({ projects: [], allData: [] }),
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
      }}
    >
      {children}
    </ScriptContext.Provider>
  );
};
