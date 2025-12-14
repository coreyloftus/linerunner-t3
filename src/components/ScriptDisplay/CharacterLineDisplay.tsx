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
        return (
          <li key={index} className="flex flex-col justify-center gap-2 p-2">
            <div className={`flex flex-col ${getAlignmentClass(line.characters)}`}>
              {!sameAsPrev && (
                <p className="text-xl font-bold">
                  {formatCharacters(line.characters)}
                </p>
              )}
              {/* sung & spoken lines have different styling */}
              {line.sung ? (
                <p className={`text-xl ${stylingSungLine}`}>
                  {line.line.toUpperCase()}
                </p>
              ) : (
                <p className="text-xl">{line.line}</p>
              )}
            </div>
          </li>
        );
      })}
      <div>
        {/* current line display */}
        <li className="flex flex-col justify-center gap-2 p-2">
          <div
            className={`flex flex-col ${lines[currentLineIndex]?.characters ? getAlignmentClass(lines[currentLineIndex]?.characters ?? []) : ""}`}
          >
            {/* only show char name if diff characters in current line */}
            {!isSameCharactersAsPrev(currentLineIndex) &&
              lines[currentLineIndex]?.characters && (
                <p className="text-xl font-bold">
                  {formatCharacters(lines[currentLineIndex]?.characters ?? [])}
                </p>
              )}
            {/* sung lines */}
            {lines[currentLineIndex]?.sung === true ? (
              <p className={`text-xl ${stylingSungLine}`}>
                {lines[currentLineIndex]?.line
                  .split(" ")
                  .slice(0, wordDisplayIndex)
                  .join(" ")
                  .toUpperCase() ?? ""}
              </p>
            ) : (
              <p className={`text-xl`}>
                {lines[currentLineIndex]?.line
                  .split(" ")
                  .slice(0, wordDisplayIndex)
                  .join(" ") ?? ""}
              </p>
            )}
          </div>
        </li>
      </div>
      {/* for scrolling to bottom */}
      <div ref={scrollRef}></div>
    </div>
  );
};
