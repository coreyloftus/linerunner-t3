"use client";
import React, { useContext } from "react";
import { ScriptContext } from "~/app/context";
export const Titlebar = () => {
  const { selectedProject, selectedScene, selectedCharacter } =
    useContext(ScriptContext);
  return (
    <>
      <div className="flex justify-around gap-2">
        <p>{selectedProject}</p>
        <p>{selectedScene}</p>
        <p>{selectedCharacter}</p>
      </div>
    </>
  );
};
