"use client";
import React, {
  createContext,
  type Dispatch,
  type SetStateAction,
  useState,
  type ReactNode,
} from "react";

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
  userConfig: { stopOnCharacter: false, autoAdvanceScript: false },
  gameMode: "navigate",
  setUserConfig: () => ({ stopOnCharacter: true, autoAdvanceScript: true }),
  setGameMode: () => "navigate",
});

export const ScriptProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [userConfig, setUserConfig] = useState<UserConfig>({
    stopOnCharacter: false,
    autoAdvanceScript: false,
  });
  const [gameMode, setGameMode] = useState<"navigate" | "linerun">("navigate");

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
      }}
    >
      {children}
    </ScriptContext.Provider>
  );
};
