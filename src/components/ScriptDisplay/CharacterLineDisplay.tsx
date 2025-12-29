import { useContext, useEffect } from "react";
import { ScriptContext, type ColorPreset } from "~/app/context";

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
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
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
}: CharacterLineDisplayProps) => {
  const lines = script?.lines ?? [];
  const { displayPreferences } = useContext(ScriptContext);

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
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentLineIndex, wordDisplayIndex, scrollRef]);
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

  return (
    <div style={{ fontSize: `${displayPreferences.fontSize}%` }}>
      {/* revealed lines */}
      {script?.lines.slice(0, currentLineIndex).map((line, index) => {
        const sameAsPrev = isSameCharactersAsPrev(index);
        const isMulti = isMultiCharacter(line.characters);
        return (
          <li key={index} className="flex flex-col justify-center gap-2 p-2">
            <div
              className={`flex flex-col ${getAlignmentClass(line.characters)} ${isMulti ? multiCharacterContainerStyling : ""}`}
            >
              {!sameAsPrev && (
                <p
                  className={`text-[1.25em] font-bold ${getNameColorClass(line.characters)}`}
                >
                  {formatCharacters(line.characters)}
                </p>
              )}
              {/* sung & spoken lines have different styling */}
              <p className={`text-[1.25em] ${getLineColorClass(line.characters)}`}>
                {line.sung ? line.line.toUpperCase() : line.line}
              </p>
            </div>
          </li>
        );
      })}
      <div>
        {/* current line display */}
        {(() => {
          const currentChars = lines[currentLineIndex]?.characters ?? [];
          const isMulti = isMultiCharacter(currentChars);
          const isSung = lines[currentLineIndex]?.sung === true;
          const lineText = lines[currentLineIndex]?.line
            .split(" ")
            .slice(0, wordDisplayIndex)
            .join(" ") ?? "";
          return (
            <li className="flex flex-col justify-center gap-2 p-2">
              <div
                className={`flex flex-col ${currentChars.length > 0 ? getAlignmentClass(currentChars) : ""} ${isMulti ? multiCharacterContainerStyling : ""}`}
              >
                {/* only show char name if diff characters in current line */}
                {!isSameCharactersAsPrev(currentLineIndex) &&
                  currentChars.length > 0 && (
                    <p
                      className={`text-[1.25em] font-bold ${getNameColorClass(currentChars)}`}
                    >
                      {formatCharacters(currentChars)}
                    </p>
                  )}
                {/* line text with appropriate color */}
                <p className={`text-[1.25em] ${getLineColorClass(currentChars)}`}>
                  {isSung ? lineText.toUpperCase() : lineText}
                </p>
              </div>
            </li>
          );
        })()}
      </div>
      {/* for scrolling to bottom */}
      <div ref={scrollRef}></div>
    </div>
  );
};
