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

interface ControlBarProps {
  playScene: boolean;
  setPlayScene: React.Dispatch<React.SetStateAction<boolean>>;
  currentLineIndex: number;
  setCurrentLineIndex: React.Dispatch<React.SetStateAction<number>>;
  currentLineSplit: string[];
  wordIndex: number;
  setWordIndex: React.Dispatch<React.SetStateAction<number>>;
  handleLineNavigation: (direction: "up" | "down") => void;
  handleWordNavigation: (direction: "left" | "right") => void;
}

export default function ControlBar({
  playScene,
  setPlayScene,

  setCurrentLineIndex,

  setWordIndex,
  handleLineNavigation,
  handleWordNavigation,
}: ControlBarProps) {
  return (
    <div className="flex h-full w-full items-center justify-between gap-2 rounded-b-md border-t border-stone-200 bg-stone-100 px-4 py-3 shadow-lg dark:border-stone-700 dark:bg-stone-800 sm:px-6">
      {/* Playback Controls */}
      <div className="flex items-center gap-1">
        <ControlButton
          variant="playback"
          onClick={() => {
            if (!playScene) {
              setPlayScene(true);
            }
          }}
        >
          {playScene === false ? <FaPlay /> : <FaPause />}
        </ControlButton>
        <ControlButton
          variant="playback"
          onClick={() => {
            setCurrentLineIndex(0);
            setWordIndex(0);
            if (playScene) setPlayScene(false);
          }}
        >
          <FaStop />
        </ControlButton>
      </div>

      {/* Navigation Controls */}
      <div className="flex gap-2">
        <div className="flex gap-2">
          <ControlButton
            onClick={() => {
              handleLineNavigation("up");
            }}
          >
            <FaArrowUp />
          </ControlButton>
          <ControlButton
            onClick={() => {
              setWordIndex(0);
              handleLineNavigation("down");
            }}
          >
            <FaArrowDown />
          </ControlButton>
        </div>

        <div className="flex gap-2">
          <ControlButton
            onClick={() => {
              handleWordNavigation("left");
            }}
          >
            <FaAngleLeft />
          </ControlButton>
          <ControlButton
            onClick={() => {
              handleWordNavigation("right");
            }}
          >
            <FaAngleRight />
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
