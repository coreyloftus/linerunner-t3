"use client";

import { useEffect, useRef } from "react";
import { getAutoAdvanceAction } from "~/lib/auto-advance";

interface UseAutoAdvanceInput {
  enabled: boolean;
  playScene: boolean;
  selectedCharacter: string;
  isUserLine: boolean;
  lineReady: boolean;
  wordIndex: number;
  wordCount: number;
  isLastLine: boolean;
  wordIntervalMs: number;
  lineGapMs: number;
  onNextWord: () => void;
  onNextLine: () => void;
}

export function useAutoAdvance({
  enabled,
  playScene,
  selectedCharacter,
  isUserLine,
  lineReady,
  wordIndex,
  wordCount,
  isLastLine,
  wordIntervalMs,
  lineGapMs,
  onNextWord,
  onNextLine,
}: UseAutoAdvanceInput) {
  const onNextWordRef = useRef(onNextWord);
  const onNextLineRef = useRef(onNextLine);
  onNextWordRef.current = onNextWord;
  onNextLineRef.current = onNextLine;

  useEffect(() => {
    const action = getAutoAdvanceAction({
      enabled,
      playScene,
      selectedCharacter,
      isUserLine,
      lineReady,
      wordIndex,
      wordCount,
      isLastLine,
      wordIntervalMs,
      lineGapMs,
    });
    if (action.type === "hold") return;

    const id = window.setTimeout(() => {
      if (action.then === "next-word") onNextWordRef.current();
      else onNextLineRef.current();
    }, action.ms);

    return () => window.clearTimeout(id);
  }, [
    enabled,
    playScene,
    selectedCharacter,
    isUserLine,
    lineReady,
    wordIndex,
    wordCount,
    isLastLine,
    wordIntervalMs,
    lineGapMs,
  ]);
}
