import { ControlButton } from "./ui/control-button";
// import { useToast } from "./ui/use-toast";
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
  // const { toast } = useToast();
  const handleClick = ({ title, desc }: { title: string; desc: string }) => {
    // toast({ title: title, description: desc });
    console.log({ title: title, description: desc });
  };

  return (
    <div className="flex h-full w-full items-center justify-between rounded-xl bg-gray-50/50 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
      {/* Playback Controls */}
      <div className="gap- flex items-center sm:gap-2">
        <ControlButton
          variant="playback"
          onClick={() => {
            handleClick({ title: "PLAY", desc: "play button clicked" });
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
            handleClick({ title: "STOP", desc: "stop playback clicked" });
            setCurrentLineIndex(0);
            setWordIndex(0);
            if (playScene) setPlayScene(false);
          }}
        >
          <FaStop />
        </ControlButton>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4 sm:gap-2">
        <div className="flex gap-2">
          <ControlButton
            onClick={() => {
              handleClick({
                title: "PREV LINE",
                desc: "prev line clicked",
              });
              handleLineNavigation("up");
            }}
          >
            <FaArrowUp />
          </ControlButton>
          <ControlButton
            onClick={() => {
              handleClick({
                title: "NEXT LINE",
                desc: "next line clicked",
              });
              setWordIndex(0);
              handleLineNavigation("down");
            }}
          >
            <FaArrowDown />
          </ControlButton>
        </div>

        <div className="flex  gap-2">
          <ControlButton
            onClick={() => {
              handleClick({
                title: "PREV WORD",
                desc: "prev word clicked",
              });
              handleWordNavigation("left");
            }}
          >
            <FaAngleLeft />
          </ControlButton>
          <ControlButton
            onClick={() => {
              handleClick({
                title: "NEXT WORD",
                desc: "next word clicked",
              });
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
