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
  gameMode: "navigate",
  setUserConfig: () => ({ stopOnCharacter: true, autoAdvanceScript: true }),
  setGameMode: () => "navigate",
  queryParams:{},
  setQueryParams: () => ({})
});

export const ScriptProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [userConfig, setUserConfig] = useState<UserConfig>({
    stopOnCharacter: true,
    autoAdvanceScript: true,
  });
  const [gameMode, setGameMode] = useState<"navigate" | "linerun">("navigate");
  const [queryParams, setQueryParams] = useState({});
  const searchParams = useSearchParams();
  useEffect(()=> {
    setQueryParams(Object.fromEntries(searchParams));
  }, [searchParams]);

  // useEffect(()=> {
  //   console.log("queryParams", queryParams);
  // })

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
      }}
    >
      {children}
    </ScriptContext.Provider>
  );
};
