import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { FaPlay } from "react-icons/fa6";
import { FaStop } from "react-icons/fa6";
import { FaPause } from "react-icons/fa6";

interface PlayStopControlsProps {
  playScene: boolean;
  setPlayScene: React.Dispatch<React.SetStateAction<boolean>>;
  currentLineIndex: number;
  setCurrentLineIndex: React.Dispatch<React.SetStateAction<number>>;
  wordDisplayIndex: number;
  setWordDisplayIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function PlayStopControls({
  playScene,
  setPlayScene,
  setCurrentLineIndex,
  setWordDisplayIndex,
}: PlayStopControlsProps) {
  const { toast } = useToast();
  const buttonStyle = "h-full w-full";
  const handleClick = ({ title, desc }: { title: string; desc: string }) => {
    toast({ title: title, description: desc });
  };

  return (
    <div className="flex h-full w-[100%] gap-2">
      <div className="flex gap-2">
        <Button
          className={buttonStyle}
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
          className={buttonStyle}
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
    </div>
  );
}
