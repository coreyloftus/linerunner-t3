import { useEffect } from "react";

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

const stylingSungLine = "text-yellow-500";
const npcLineStyling = "justify-end text-right";
const multiCharacterStyling = "justify-center text-center";

// Styling for multi-character (ensemble/duet) lines
const multiCharacterContainerStyling =
  "bg-gradient-to-r from-transparent via-violet-500/10 to-transparent border-l-2 border-r-2 border-violet-400/30 px-4 py-1 rounded-md";
const multiCharacterNameStyling = "text-violet-400";
const multiCharacterLineStyling = "text-violet-200";

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
    <div>
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
                  className={`text-xl font-bold ${isMulti ? multiCharacterNameStyling : ""}`}
                >
                  {formatCharacters(line.characters)}
                </p>
              )}
              {/* sung & spoken lines have different styling */}
              {line.sung ? (
                <p
                  className={`text-xl ${isMulti ? multiCharacterLineStyling : ""} ${stylingSungLine}`}
                >
                  {line.line.toUpperCase()}
                </p>
              ) : (
                <p className={`text-xl ${isMulti ? multiCharacterLineStyling : ""}`}>
                  {line.line}
                </p>
              )}
            </div>
          </li>
        );
      })}
      <div>
        {/* current line display */}
        {(() => {
          const currentChars = lines[currentLineIndex]?.characters ?? [];
          const isMulti = isMultiCharacter(currentChars);
          return (
            <li className="flex flex-col justify-center gap-2 p-2">
              <div
                className={`flex flex-col ${currentChars.length > 0 ? getAlignmentClass(currentChars) : ""} ${isMulti ? multiCharacterContainerStyling : ""}`}
              >
                {/* only show char name if diff characters in current line */}
                {!isSameCharactersAsPrev(currentLineIndex) &&
                  currentChars.length > 0 && (
                    <p
                      className={`text-xl font-bold ${isMulti ? multiCharacterNameStyling : ""}`}
                    >
                      {formatCharacters(currentChars)}
                    </p>
                  )}
                {/* sung lines */}
                {lines[currentLineIndex]?.sung === true ? (
                  <p
                    className={`text-xl ${isMulti ? multiCharacterLineStyling : ""} ${stylingSungLine}`}
                  >
                    {lines[currentLineIndex]?.line
                      .split(" ")
                      .slice(0, wordDisplayIndex)
                      .join(" ")
                      .toUpperCase() ?? ""}
                  </p>
                ) : (
                  <p className={`text-xl ${isMulti ? multiCharacterLineStyling : ""}`}>
                    {lines[currentLineIndex]?.line
                      .split(" ")
                      .slice(0, wordDisplayIndex)
                      .join(" ") ?? ""}
                  </p>
                )}
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
