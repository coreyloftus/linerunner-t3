import { ControlButton } from "./ui/control-button";
import { FaPlay } from "react-icons/fa6";
import { FaStop } from "react-icons/fa6";
import { FaPause } from "react-icons/fa6";
import {
  FaAngleLeft,
  FaAngleRight,
  FaArrowDown,
  FaArrowUp,
} from "react-icons/fa6";
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
}

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
}: ControlBarProps) {
  const playPause = () => {
    if (!playScene) {
      setPaused(false);
      setPlayScene(true);
    } else {
      setPaused((isPaused) => !isPaused);
    }
  };
  const stop = () => {
    setCurrentLineIndex(0);
    setWordIndex(0);
    setPaused(false);
    if (playScene) setPlayScene(false);
  };
  const lineDown = () => {
    setWordIndex(0);
    handleLineNavigation("down");
  };
  const playIcon = !playScene || paused ? <FaPlay /> : <FaPause />;

  const bottomBar = (
    <div
      className={`flex h-full w-full items-center justify-between gap-2 border-t border-border bg-surface-raised/90 px-3 py-1 backdrop-blur-sm xs:gap-4 xs:px-1 xs:py-1 sm:px-6 tablet:py-2 ${side === "right" ? "md:hidden" : ""}`}
    >
      {/* Playback Controls */}
      <div className="flex h-full items-center gap-1">
        <ControlButton variant="playback" onClick={playPause}>
          {playIcon}
        </ControlButton>
        <ControlButton variant="playback" onClick={stop}>
          <FaStop />
        </ControlButton>
      </div>

      {/* Navigation Controls */}
      <div className="flex h-full gap-1 tablet:gap-2">
        <div className="flex h-full gap-1 tablet:gap-2">
          <ControlButton onClick={() => handleLineNavigation("up")}>
            <FaArrowUp />
          </ControlButton>
          <ControlButton onClick={lineDown}>
            <FaArrowDown />
          </ControlButton>
        </div>

        <div className="flex gap-1 tablet:gap-2">
          <ControlButton onClick={() => handleWordNavigation("left")}>
            <FaAngleLeft />
          </ControlButton>
          <ControlButton onClick={() => handleWordNavigation("right")}>
            <FaAngleRight />
          </ControlButton>
        </div>
      </div>
    </div>
  );

  if (side === "bottom") return bottomBar;

  // Right column on tablet and desktop: next line sits lowest, under the thumb
  return (
    <>
      {bottomBar}
      <div className="hidden h-full w-full flex-col justify-end border-l border-border bg-surface-raised/90 p-3 backdrop-blur-sm md:flex">
        <div className="grid grid-cols-2 gap-2">
          <ControlButton size="column" variant="playback" onClick={playPause}>
            {playIcon}
          </ControlButton>
          <ControlButton size="column" variant="playback" onClick={stop}>
            <FaStop />
          </ControlButton>
          <ControlButton
            size="column"
            onClick={() => handleWordNavigation("left")}
          >
            <FaAngleLeft />
          </ControlButton>
          <ControlButton
            size="column"
            onClick={() => handleWordNavigation("right")}
          >
            <FaAngleRight />
          </ControlButton>
          <ControlButton
            size="column"
            className="col-span-2"
            onClick={() => handleLineNavigation("up")}
          >
            <FaArrowUp />
          </ControlButton>
          <ControlButton
            size="column"
            className="col-span-2 h-28 tablet:h-36"
            onClick={lineDown}
          >
            <FaArrowDown />
          </ControlButton>
        </div>
      </div>
    </>
  );
}
