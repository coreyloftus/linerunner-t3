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
  // currentLineSplitIndex: number;
  wordIndex: number;
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
}

const stylingSungLine = "text-yellow-400";
export const CharacterLineDisplay = ({
  script,
  currentLineIndex,
  // currentLineSplitIndex,
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
      {script?.lines.slice(0, currentLineIndex).map((line, index) => (
        <li key={index} className="flex flex-col justify-center gap-2 p-2">
          <p className="text-xl font-bold">{line.character.toUpperCase()}</p>
          <p className={`text-xl ${line.sung && stylingSungLine}`}>
            {line.line}
          </p>
        </li>
      ))}
      <div>
        {/* current line display */}
        <li className="flex flex-col justify-center gap-2 p-2">
          <p className="text-xl font-bold">
            {lines[currentLineIndex]?.character.toUpperCase()}
          </p>
          <p
            className={`text-xl ${lines[currentLineIndex]?.sung && stylingSungLine}`}
          >
            {lines[currentLineIndex]?.line
              .split(" ")
              .slice(0, wordDisplayIndex)
              .join(" ")
              .toUpperCase() ?? ""}
          </p>
        </li>
      </div>
      {/* for scrolling to bottom */}
      <div ref={scrollRef}></div>
    </div>
  );
};
