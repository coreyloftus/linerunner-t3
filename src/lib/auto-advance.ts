export type AutoAdvanceAction =
  | { type: "wait"; ms: number; then: "next-word" }
  | { type: "wait"; ms: number; then: "next-line" }
  | { type: "hold" };

export function getAutoAdvanceAction(input: {
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
}): AutoAdvanceAction {
  if (
    !input.lineReady ||
    !input.enabled ||
    !input.playScene ||
    input.selectedCharacter === "" ||
    input.isUserLine
  ) {
    return { type: "hold" };
  }

  if (input.wordIndex < input.wordCount) {
    return { type: "wait", ms: input.wordIntervalMs, then: "next-word" };
  }

  if (!input.isLastLine) {
    return { type: "wait", ms: input.lineGapMs, then: "next-line" };
  }

  return { type: "hold" };
}
