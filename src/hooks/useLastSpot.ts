"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { ScriptContext } from "~/app/context";
import { type AppMode } from "~/lib/app-mode";
import { type LastSpot } from "~/lib/last-spot";

const SAVE_DELAY_MS = 1000;

// Reopens a signed-in user's last mode, script, scene, line or melody, and keeps it saved
export function useLastSpot(mode: AppMode, setMode: (mode: AppMode) => void) {
  const router = useRouter();
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const {
    selectedProject,
    selectedCharacter,
    selectedScene,
    currentLineIndex,
    pendingLineIndex,
    setPendingLineIndex,
    queryParams,
  } = useContext(ScriptContext);
  const [restored, setRestored] = useState(false);
  const lastSaved = useRef("");

  const { data: spot, isFetched } = api.lastSpot.get.useQuery(undefined, {
    enabled: signedIn,
    refetchOnWindowFocus: false,
  });
  const { mutate: saveSpot } = api.lastSpot.save.useMutation();

  // Restore once per page load, unless the URL already points somewhere
  useEffect(() => {
    if (restored || !signedIn || !isFetched) return;
    setRestored(true);
    const params = new URLSearchParams(window.location.search);
    if (!spot || params.has("project") || params.has("melody")) return;

    const next = new URLSearchParams();
    if (spot.project) next.set("project", spot.project);
    if (spot.project && spot.source) next.set("source", spot.source);
    if (spot.project && spot.character) next.set("character", spot.character);
    if (spot.project && spot.character && spot.scene)
      next.set("scene", spot.scene);
    if (spot.mode === "melody" && spot.melody) next.set("melody", spot.melody);
    if (next.toString()) router.replace(`?${next.toString()}`);
    if (spot.line) setPendingLineIndex(spot.line);
    setMode(spot.mode);
  }, [restored, signedIn, isFetched, spot, router, setMode, setPendingLineIndex]);

  const melody = queryParams.melody;
  useEffect(() => {
    if (!restored || !signedIn) return;
    const next: LastSpot = {
      mode,
      project: selectedProject?.name,
      source: selectedProject?.source,
      character: selectedCharacter || undefined,
      scene: selectedScene || undefined,
      line: pendingLineIndex ?? currentLineIndex,
      melody,
    };
    const key = JSON.stringify(next);
    if (key === lastSaved.current) return;
    const timer = setTimeout(() => {
      lastSaved.current = key;
      saveSpot(next);
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [
    restored,
    signedIn,
    mode,
    selectedProject,
    selectedCharacter,
    selectedScene,
    currentLineIndex,
    pendingLineIndex,
    melody,
    saveSpot,
  ]);
}

// Jumps to the restored line once the scene has lines to show
export function useRestoreLine(lineCount: number) {
  const { pendingLineIndex, setPendingLineIndex, setCurrentLineIndex } =
    useContext(ScriptContext);

  useEffect(() => {
    if (pendingLineIndex === null || lineCount === 0) return;
    setCurrentLineIndex(Math.min(pendingLineIndex, lineCount - 1));
    setPendingLineIndex(null);
  }, [pendingLineIndex, lineCount, setCurrentLineIndex, setPendingLineIndex]);
}
