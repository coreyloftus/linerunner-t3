import { useEffect } from "react";

interface CharacterLineDisplayProps {
  script:
    | {
        lines: {
          character: string;
          line: string;
        }[];
      }
    | null
    | undefined;
  currentLineIndex: number;
  currentLineSplitIndex: number;
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
}
export const CharacterLineDisplay = ({
  script,
  currentLineIndex,
  currentLineSplitIndex,
  scrollRef,
}: CharacterLineDisplayProps) => {
  const lines = script?.lines ?? [];
  const displayIndex = Math.min(currentLineIndex, lines.length - 1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentLineIndex, currentLineSplitIndex, scrollRef]);
  return (
    <div>
      {/* revealed lines */}
      {script?.lines.slice(0, displayIndex).map((line, index) => (
        <li key={index} className="flex flex-col justify-center gap-2 p-2">
          <p className="text-xl font-bold">{line.character.toUpperCase()}</p>
          <p className="text-xl">{line.line}</p>
        </li>
      ))}
      <div>
        {/* current line display */}
        <li className="flex flex-col justify-center gap-2 p-2">
          <p className="text-xl font-bold">
            {lines[displayIndex]?.character.toUpperCase()}
          </p>
          <p className="text-xl">
            {lines[displayIndex]?.line
              .split(" ")
              .slice(0, currentLineSplitIndex)
              .join(" ") ?? "a"}
          </p>
        </li>
      </div>
      {/* for scrolling to bottom */}
      <div ref={scrollRef}></div>
    </div>
  );
};
