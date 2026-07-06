"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API isn't in TypeScript's dom lib yet — declare what we use
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Lowercase, drop apostrophes ("didn't" ≡ "didnt"), strip punctuation, split */
export const normalizeWords = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * How much of `target` has been spoken, in order — the longest common
 * subsequence of normalized words over the target length. Forgiving of
 * filler words and recognition noise on both sides, strict about order.
 */
export const matchRatio = (spoken: string, target: string): number => {
  const targetWords = normalizeWords(target);
  if (targetWords.length === 0) return 0;
  const spokenWords = normalizeWords(spoken);
  if (spokenWords.length === 0) return 0;

  const cols = targetWords.length + 1;
  let prev = new Array<number>(cols).fill(0);
  let curr = new Array<number>(cols).fill(0);
  for (const spokenWord of spokenWords) {
    for (let j = 1; j < cols; j++) {
      curr[j] =
        spokenWord === targetWords[j - 1]
          ? (prev[j - 1] ?? 0) + 1
          : Math.max(prev[j] ?? 0, curr[j - 1] ?? 0);
    }
    [prev, curr] = [curr, prev];
  }
  return (prev[cols - 1] ?? 0) / targetWords.length;
};

export interface UseSpeechMatchOptions {
  /** The line the actor is supposed to say */
  targetText: string;
  /** Only listen while this is true */
  active: boolean;
  /** Ratio of target words (0-1) that counts as a match */
  threshold?: number;
  /** Called once when the spoken text matches the target */
  onMatch: () => void;
}

export function useSpeechMatch({
  targetText,
  active,
  threshold = 0.8,
  onMatch,
}: UseSpeechMatchOptions) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [ratio, setRatio] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const matchedRef = useRef(false);
  // Keep the latest values in refs so the recognition callback never goes stale
  const targetRef = useRef(targetText);
  const onMatchRef = useRef(onMatch);
  targetRef.current = targetText;
  onMatchRef.current = onMatch;

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  // Reset per-line state whenever the target line changes
  useEffect(() => {
    matchedRef.current = false;
    setTranscript("");
    setRatio(0);
  }, [targetText]);

  useEffect(() => {
    const SpeechRecognitionImpl = getSpeechRecognition();
    if (!active || !SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let stopped = false;

    recognition.onresult = (event) => {
      const results = Array.from(
        { length: event.results.length },
        (_, i) => event.results[i],
      );
      const text = results
        .map((result) => result?.[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setTranscript(text);

      const r = matchRatio(text, targetRef.current);
      setRatio(r);
      if (r >= threshold && !matchedRef.current) {
        matchedRef.current = true;
        onMatchRef.current();
      }
    };

    recognition.onerror = (event) => {
      // "no-speech" just ends the session and onend restarts it, but a
      // permission denial must not trigger the restart loop
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed" ||
        event.error === "audio-capture"
      ) {
        stopped = true;
        setListening(false);
      }
    };

    // Recognition sessions time out on silence — restart while still active
    recognition.onend = () => {
      if (!stopped) {
        try {
          recognition.start();
        } catch {
          setListening(false);
        }
      }
    };

    try {
      recognition.start();
      setListening(true);
      recognitionRef.current = recognition;
    } catch {
      setListening(false);
    }

    return () => {
      stopped = true;
      recognition.onresult = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
      setListening(false);
      setTranscript("");
      setRatio(0);
    };
  }, [active, threshold]);

  const stop = useCallback(() => {
    recognitionRef.current?.abort();
  }, []);

  return { supported, listening, transcript, ratio, stop };
}
