import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { FaPlay } from "react-icons/fa6";
import { FaStop } from "react-icons/fa6";
import { FaPause } from "react-icons/fa6";
import { FaForwardStep } from "react-icons/fa6";
import { FaBackwardStep } from "react-icons/fa6";

interface ControlBarProps {
  playScene: boolean;
  setPlayScene: React.Dispatch<React.SetStateAction<boolean>>;
  currentLineIndex: number;
  setCurrentLineIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function ControlBar({
  playScene,
  setPlayScene,
  currentLineIndex,
  setCurrentLineIndex,
}: ControlBarProps) {
  const { toast } = useToast();

  const handleClick = ({ title, desc }: { title: string; desc: string }) => {
    toast({ title: title, description: desc });
  };
  // const handleClose = (
  //   event: React.SyntheticEvent | Event,
  //   reason?: string,
  // ) => {
  //   if (reason === "clickaway") {
  //     return;
  //   }
  // };

  return (
    <div className="flex justify-center gap-2">
      <div>
        <Button
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
      </div>
      <div>
        <Button
          variant={"outline"}
          onClick={() => {
            handleClick({ title: "STOP", desc: "stop playback clicked" });
            setCurrentLineIndex(0);
            if (playScene) setPlayScene(false);
          }}
        >
          <p className="text-2xl">
            <FaStop />
          </p>
        </Button>
      </div>
      <div>
        <Button
          variant={"outline"}
          onClick={() => {
            handleClick({
              title: "SKIP BACK",
              desc: "skip to prev line clicked",
            });
            setCurrentLineIndex(currentLineIndex - 1);
          }}
        >
          <p className="text-2xl">
            <FaBackwardStep />
          </p>
        </Button>
      </div>
      <div>
        <Button
          // className="border-2 border-white"
          variant={"outline"}
          onClick={() => {
            handleClick({
              title: "SKIP FWD",
              desc: "skip to next line clicked",
            });
            setCurrentLineIndex(currentLineIndex + 1);
          }}
        >
          <p className="text-2xl">
            <FaForwardStep />
          </p>
        </Button>
      </div>
    </div>
  );
}
