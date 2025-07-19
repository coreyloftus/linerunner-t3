import { useEffect } from "react";

interface CharacterLineDisplayProps {
  script:
    | {
        lines: {
          character: string;
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
  return (
    <div>
      {/* revealed lines */}
      {script?.lines.slice(0, currentLineIndex).map((line, index) => {
        const isSameCharacterAsPrev =
          index > 0 && line.character === script?.lines[index - 1]?.character;
        return (
          <li key={index} className="flex flex-col justify-center gap-2 p-2">
            <div
              className={`flex flex-col ${line.character !== selectedCharacter && npcLineStyling}`}
            >
              {!isSameCharacterAsPrev && (
                <p className="text-xl font-bold">
                  {line.character.toUpperCase()}
                </p>
              )}
              {/* sung & spoken lines have different styling */}
              {line.sung ? (
                <p className={`text-xl ${line.sung && stylingSungLine}`}>
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
            className={`flex flex-col ${lines[currentLineIndex]?.character !== selectedCharacter && npcLineStyling}`}
          >
            {/* only show char name if diff character in current line  */}
            {!(
              lines[currentLineIndex]?.character ===
              lines[currentLineIndex - 1]?.character
            ) && (
              <>
                <p className="text-xl font-bold">
                  {lines[currentLineIndex]?.character.toUpperCase()}
                </p>
              </>
            )}
            {/* spoken lines */}
            {lines[currentLineIndex] &&
            lines[currentLineIndex]?.sung &&
            lines[currentLineIndex]?.sung === true ? (
              <p
                className={`text-xl ${lines[currentLineIndex]?.sung && stylingSungLine}`}
              >
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
