import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
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
  wordDisplayIndex: number;
  setWordDisplayIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function ControlBar({
  playScene,
  setPlayScene,
  currentLineIndex,
  setCurrentLineIndex,
  wordDisplayIndex,
  setWordDisplayIndex,
}: ControlBarProps) {
  const { toast } = useToast();
  const buttonStyle = "h-full w-full";
  const handleClick = ({ title, desc }: { title: string; desc: string }) => {
    toast({ title: title, description: desc });
  };

  return (
    <div className="flex h-full w-[100%] gap-2">
      <div className="flex gap-2">
        <Button
          className="h-full"
          variant={"outline"}
          onClick={() => {
            handleClick({ title: "PLAY", desc: "play button clicked" });
            if (!playScene) {
              setPlayScene(true);
            }
          }}
        >
          <p className="text-xl">
            {playScene === false ? <FaPlay /> : <FaPause />}
          </p>
        </Button>
        <Button
          className="h-full"
          variant={"outline"}
          onClick={() => {
            handleClick({ title: "STOP", desc: "stop playback clicked" });
            setCurrentLineIndex(0);
            setWordDisplayIndex(0);
            if (playScene) setPlayScene(false);
          }}
        >
          <p className="text-xl">
            <FaStop />
          </p>
        </Button>
      </div>
      <div className="flex flex-1 gap-2">
        <div className="flex-1">
          <Button
            className={buttonStyle}
            variant={"outline"}
            onClick={() => {
              handleClick({
                title: "PREV LINE",
                desc: "prev line clicked",
              });
              setWordDisplayIndex(0);
              setCurrentLineIndex(currentLineIndex - 1);
            }}
          >
            <p className="text-2xl">
              <FaArrowUp />
            </p>
          </Button>
        </div>
        <div className="flex-1">
          <Button
            className={buttonStyle}
            variant={"outline"}
            onClick={() => {
              handleClick({
                title: "NEXT LINE",
                desc: "next line clicked",
              });
              setWordDisplayIndex(0);
              setCurrentLineIndex(currentLineIndex + 1);
            }}
          >
            <p className="text-2xl">
              <FaArrowDown />
            </p>
          </Button>
        </div>
        <div className="flex-1">
          <Button
            className={buttonStyle}
            variant={"outline"}
            onClick={() => {
              handleClick({
                title: "PREV WORD",
                desc: "prev word clicked",
              });
              setWordDisplayIndex(wordDisplayIndex - 1);
            }}
          >
            <p className="text-2xl">
              <FaAngleLeft />
            </p>
          </Button>
        </div>
        <div className="flex-1">
          <Button
            className={buttonStyle}
            variant={"outline"}
            onClick={() => {
              handleClick({
                title: "NEXT WORD",
                desc: "next word clicked",
              });
              setWordDisplayIndex(wordDisplayIndex + 1);
            }}
          >
            <p className="text-2xl">
              <FaAngleRight />
            </p>
          </Button>
        </div>
      </div>
    </div>
  );
}
