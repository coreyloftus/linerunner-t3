import { type ReactNode } from "react";
import {
  IoArrowDown,
  IoArrowUp,
  IoChevronBack,
  IoChevronForward,
  IoDocumentTextOutline,
  IoPause,
  IoPlay,
  IoStop,
} from "react-icons/io5";
import { type ControlsSide } from "~/lib/preferences";

interface ControlBarProps {
  playScene: boolean;
  setPlayScene: React.Dispatch<React.SetStateAction<boolean>>;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  currentLineIndex: number;
  setCurrentLineIndex: React.Dispatch<React.SetStateAction<number>>;
  currentLineSplit: string[];
  wordIndex: number;
  setWordIndex: React.Dispatch<React.SetStateAction<number>>;
  handleLineNavigation: (direction: "up" | "down") => void;
  handleWordNavigation: (direction: "left" | "right") => void;
  side?: ControlsSide;
  fullScript?: { on: boolean; toggle: () => void };
}

function Round({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      className={`press flex h-12 w-12 touch-manipulation items-center justify-center rounded-full text-[22px] transition-colors tablet:h-14 tablet:w-14 tablet:text-[26px] ${
        active
          ? "bg-accent/15 text-accent"
          : "text-foreground/80 hover:bg-foreground/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

// Floating control capsule; Next Line is the one prominent button
export default function ControlBar({
  playScene,
  setPlayScene,
  paused,
  setPaused,
  setCurrentLineIndex,
  setWordIndex,
  handleLineNavigation,
  handleWordNavigation,
  side = "bottom",
  fullScript,
}: ControlBarProps) {
  const playing = playScene && !paused;
  const vertical = side === "right" ? "md:flex-col" : "";
  const divider =
    side === "right"
      ? "mx-1 h-8 w-px bg-foreground/10 md:mx-0 md:my-1 md:h-px md:w-8"
      : "mx-1 h-8 w-px bg-foreground/10";

  return (
    <div
      className={`glass flex items-center gap-0.5 rounded-full p-1.5 tablet:gap-1 tablet:p-2 ${vertical}`}
    >
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={(event) => {
          if (!playScene) {
            setPaused(false);
            setPlayScene(true);
          } else {
            setPaused((isPaused) => !isPaused);
          }
          event.currentTarget.blur();
        }}
        className="press flex h-12 w-12 touch-manipulation items-center justify-center rounded-full bg-foreground/[0.08] text-[22px] text-foreground tablet:h-14 tablet:w-14 tablet:text-[26px]"
      >
        {playing ? <IoPause /> : <IoPlay className="translate-x-0.5" />}
      </button>
      <span className="hidden md:contents">
        <Round
          label="Stop"
          onClick={() => {
            setCurrentLineIndex(0);
            setWordIndex(0);
            setPaused(false);
            if (playScene) setPlayScene(false);
          }}
        >
          <IoStop className="text-[0.85em]" />
        </Round>
      </span>
      <span aria-hidden className={divider} />
      <Round label="Previous word" onClick={() => handleWordNavigation("left")}>
        <IoChevronBack />
      </Round>
      <Round label="Next word" onClick={() => handleWordNavigation("right")}>
        <IoChevronForward />
      </Round>
      <Round label="Previous line" onClick={() => handleLineNavigation("up")}>
        <IoArrowUp />
      </Round>
      <button
        type="button"
        onClick={(event) => {
          handleLineNavigation("down");
          event.currentTarget.blur();
        }}
        aria-label="Next line"
        title="Next line"
        className={`press mx-1 flex h-12 w-20 touch-manipulation items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/30 tablet:h-14 tablet:w-24 ${side === "right" ? "md:mx-0 md:my-1 md:!h-32 md:!w-12 tablet:!w-14" : ""}`}
      >
        <IoArrowDown className="h-6 w-6 flex-shrink-0 tablet:h-7 tablet:w-7" />
      </button>
      {fullScript && (
        <Round
          label="Full script"
          onClick={fullScript.toggle}
          active={fullScript.on}
        >
          <IoDocumentTextOutline />
        </Round>
      )}
    </div>
  );
}
