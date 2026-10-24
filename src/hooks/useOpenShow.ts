"use client";

import { useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { ScriptContext, type ProjectSource } from "~/app/context";
import { selectionQuery } from "~/lib/sources";

// Opens a show at a scene and keeps the URL in step; the remembered character fills in after
export function useOpenShow() {
  const router = useRouter();
  const { setSelectedProject, setSelectedScene, setSelectedCharacter } =
    useContext(ScriptContext);

  return useCallback(
    (name: string, source: ProjectSource, scene: string) => {
      setSelectedProject({ name, source });
      setSelectedScene(scene);
      setSelectedCharacter("");
      router.replace(selectionQuery({ project: name, source, scene }));
    },
    [router, setSelectedProject, setSelectedScene, setSelectedCharacter],
  );
}
