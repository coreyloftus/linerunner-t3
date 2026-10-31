import { useContext, useEffect, useRef } from "react";
import { ScriptContext, type ColorPreset } from "~/app/context";
import { LineAudioButton } from "./LineAudioButton";

interface CharacterLineDisplayProps {
  script:
    | {
        lines: {
          characters: string[];
          line: string;
          sung?: boolean;
        }[];
      }
    | null
    | undefined;
  currentLineIndex: number;
  selectedCharacter: string;
  wordIndex: number;
  projectName?: string;
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
  // Shows every line of the scene, with the current line fully revealed
  showAll?: boolean;
}

const npcLineStyling = "justify-end text-right";
const multiCharacterStyling = "justify-center text-center";

// Color class lookup map - using full class names to prevent Tailwind purging
const COLOR_CLASS_MAP: Record<ColorPreset, string> = {
  default: "",
  "violet-400": "text-violet-400",
  "blue-400": "text-blue-400",
  "emerald-400": "text-emerald-400",
  "rose-400": "text-rose-400",
  "amber-400": "text-amber-400",
  "cyan-400": "text-cyan-400",
  "stone-400": "text-stone-400",
};

// Styling for multi-character (ensemble/duet) lines - just alignment, no background
const multiCharacterContainerStyling = "";

// Helper to check if user is in the line's characters
const isUserLine = (characters: string[], selectedCharacter: string) =>
  characters.includes(selectedCharacter);

// Helper to check if line has multiple characters
const isMultiCharacter = (characters: string[]) => characters.length > 1;

// Helper to format character names for display
const formatCharacters = (characters: string[]) =>
  characters.map((c) => c.toUpperCase()).join(" & ");

export const CharacterLineDisplay = ({
  script,
  currentLineIndex,
  selectedCharacter,
  scrollRef,
  wordIndex: wordDisplayIndex,
  projectName,
  showAll = false,
}: CharacterLineDisplayProps) => {
  const lines = script?.lines ?? [];
  const { displayPreferences } = useContext(ScriptContext);
  const currentRef = useRef<HTMLLIElement | null>(null);

  // Get color class based on line type (uses character color preferences)
  const getLineColorClass = (characters: string[]): string => {
    if (isMultiCharacter(characters)) {
      return COLOR_CLASS_MAP[displayPreferences.sharedLineColor];
    }
    if (isUserLine(characters, selectedCharacter)) {
      return COLOR_CLASS_MAP[displayPreferences.ownCharacterColor];
    }
    return COLOR_CLASS_MAP[displayPreferences.otherCharacterColor];
  };

  // Get color class for character name
  const getNameColorClass = (characters: string[]): string => {
    if (isMultiCharacter(characters)) {
      return COLOR_CLASS_MAP[displayPreferences.sharedLineColor];
    }
    if (isUserLine(characters, selectedCharacter)) {
      return COLOR_CLASS_MAP[displayPreferences.ownCharacterColor];
    }
    return COLOR_CLASS_MAP[displayPreferences.otherCharacterColor];
  };

  useEffect(() => {
    if (showAll) {
      currentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentLineIndex, wordDisplayIndex, scrollRef, showAll]);
  // Get alignment class based on line type
  const getAlignmentClass = (characters: string[]) => {
    if (isMultiCharacter(characters)) {
      return multiCharacterStyling;
    }
    return isUserLine(characters, selectedCharacter) ? "" : npcLineStyling;
  };

  // Check if characters are same as previous line
  const isSameCharactersAsPrev = (index: number) => {
    if (index === 0) return false;
    const prevLine = script?.lines[index - 1];
    const currentLine = script?.lines[index];
    if (!prevLine || !currentLine) return false;
    return (
      prevLine.characters.length === currentLine.characters.length &&
      prevLine.characters.every((c) => currentLine.characters.includes(c))
    );
  };

  // Renders a line before or after the current one
  const renderOtherLine = (
    line: NonNullable<typeof script>["lines"][number],
    index: number,
  ) => {
    const sameAsPrev = isSameCharactersAsPrev(index);
    const isMulti = isMultiCharacter(line.characters);
    return (
      <li
        key={index}
        className="flex flex-col justify-center gap-2 px-3 py-3 opacity-50 transition-opacity hover:opacity-100"
      >
        <div
          className={`flex flex-col gap-0.5 ${getAlignmentClass(line.characters)} ${isMulti ? multiCharacterContainerStyling : ""}`}
        >
          {!sameAsPrev && (
            <p
              className={`font-sans text-[0.72em] font-semibold uppercase tracking-[0.14em] ${getNameColorClass(line.characters) || "text-muted-foreground"}`}
            >
              {formatCharacters(line.characters)}
            </p>
          )}
          {/* sung & spoken lines have different styling */}
          <p
            className={`font-reading text-[1.3em] leading-snug ${line.sung ? "italic" : ""} ${getLineColorClass(line.characters)}`}
          >
            {line.sung ? line.line.toUpperCase() : line.line}
          </p>
          {projectName && (
            <LineAudioButton
              projectName={projectName}
              characters={line.characters}
              text={line.line}
            />
          )}
        </div>
      </li>
    );
  };

  return (
    <div
      className="mx-auto max-w-2xl py-3"
      style={{ fontSize: `${displayPreferences.fontSize}%` }}
    >
      {/* revealed lines */}
      {lines
        .slice(0, currentLineIndex)
        .map((line, index) => renderOtherLine(line, index))}
      <div>
        {/* current line display */}
        {(() => {
          const currentChars = lines[currentLineIndex]?.characters ?? [];
          const isMulti = isMultiCharacter(currentChars);
          const isSung = lines[currentLineIndex]?.sung === true;
          const fullLine = lines[currentLineIndex]?.line ?? "";
          const lineText = showAll
            ? fullLine
            : fullLine.split(" ").slice(0, wordDisplayIndex).join(" ");
          const isConcealed = lineText === "" && currentChars.length > 0;
          return (
            <li
              ref={currentRef}
              className="flex flex-col justify-center gap-2 px-1 py-1"
            >
              <div
                className={`flex flex-col gap-1 px-2 py-3 ${currentChars.length > 0 ? getAlignmentClass(currentChars) : ""} ${isMulti ? multiCharacterContainerStyling : ""}`}
              >
                {/* only show char name if diff characters in current line */}
                {!isSameCharactersAsPrev(currentLineIndex) &&
                  currentChars.length > 0 && (
                    <p
                      className={`font-sans text-[0.72em] font-semibold uppercase tracking-[0.14em] ${getNameColorClass(currentChars) || "text-accent"}`}
                    >
                      {formatCharacters(currentChars)}
                    </p>
                  )}
                {/* concealed line shows a pulsing cue marker until revealed */}
                {isConcealed ? (
                  <p
                    className="cue-dot font-reading text-[1.5em] leading-snug text-accent"
                    aria-label="Line hidden — press down arrow to reveal"
                  >
                    ···
                  </p>
                ) : (
                  <p
                    key={`${currentLineIndex}-${wordDisplayIndex > 0 ? "revealed" : "hidden"}`}
                    className={`line-enter font-reading text-[1.5em] font-medium leading-snug ${isSung ? "italic" : ""} ${getLineColorClass(currentChars)}`}
                  >
                    {isSung ? lineText.toUpperCase() : lineText}
                  </p>
                )}
                {!isConcealed && projectName && (
                  <LineAudioButton
                    projectName={projectName}
                    characters={currentChars}
                    text={lines[currentLineIndex]?.line ?? ""}
                  />
                )}
              </div>
            </li>
          );
        })()}
      </div>
      {/* upcoming lines */}
      {showAll &&
        lines
          .slice(currentLineIndex + 1)
          .map((line, offset) =>
            renderOtherLine(line, currentLineIndex + 1 + offset),
          )}
      {/* for scrolling to bottom; margin keeps the line clear of the floating controls */}
      <div ref={scrollRef} className="scroll-mb-48"></div>
    </div>
  );
};
