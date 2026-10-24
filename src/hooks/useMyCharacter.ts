"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { ScriptContext } from "~/app/context";
import { selectionQuery, showKey } from "~/lib/sources";

// Remembers the character a signed-in user plays in each show, and fills it in when they reopen that show
export function useMyCharacter() {
  const router = useRouter();
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const utils = api.useUtils();
  const { selectedProject, selectedCharacter, setSelectedCharacter, selectedScene } =
    useContext(ScriptContext);

  const { data: myCharacters } = api.lastSpot.myCharacters.useQuery(undefined, {
    enabled: signedIn,
    refetchOnWindowFocus: false,
  });
  const { mutate: save } = api.lastSpot.saveMyCharacter.useMutation({
    onSuccess: () => void utils.lastSpot.myCharacters.invalidate(),
  });

  const key = selectedProject
    ? showKey(selectedProject.source, selectedProject.name)
    : null;
  const remembered = key ? myCharacters?.[key] : undefined;

  // Fill in the remembered character when a show opens without one
  const filledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedProject || !key || selectedCharacter || !remembered) return;
    if (filledFor.current === key) return;
    filledFor.current = key;
    setSelectedCharacter(remembered);
    router.replace(
      selectionQuery({
        project: selectedProject.name,
        source: selectedProject.source,
        character: remembered,
        scene: selectedScene,
      }),
    );
  }, [key, selectedProject, selectedCharacter, selectedScene, remembered, setSelectedCharacter, router]);

  // A different show can be filled again later
  useEffect(() => {
    if (filledFor.current && filledFor.current !== key) filledFor.current = null;
  }, [key]);

  // Save a new pick
  useEffect(() => {
    if (!signedIn || !key || !selectedCharacter || !myCharacters) return;
    if (myCharacters[key] === selectedCharacter) return;
    save({ show: key, character: selectedCharacter });
  }, [signedIn, key, selectedCharacter, myCharacters, save]);
}

// Picks a character for the current show and keeps the URL in step
export function usePickCharacter() {
  const router = useRouter();
  const { selectedProject, selectedScene, setSelectedCharacter } =
    useContext(ScriptContext);

  return useCallback(
    (character: string) => {
      if (!selectedProject) return;
      setSelectedCharacter(character);
      router.replace(
        selectionQuery({
          project: selectedProject.name,
          source: selectedProject.source,
          character,
          scene: selectedScene,
        }),
      );
    },
    [router, selectedProject, selectedScene, setSelectedCharacter],
  );
}
