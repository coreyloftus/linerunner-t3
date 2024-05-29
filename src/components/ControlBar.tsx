// import {
//   Box,
//   Card,
//   IconButton,
//   Paper,
//   Snackbar,
//   Typography,
// } from "@mui/material";
// import { PlayCircleFilledWhite, PauseCircleOutline as PauseCircleOutlineIcon, StopCircle as StopCircleIcon, SkipNext as SkipNextIcon, SkipPrevious as SkipPreviousIcon } from '@mui/icons-material'
// import CloseIcon from '@mui/icons-material/Close'
import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
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
  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
  };

  return (
    <div className="flex justify-center gap-2">
      <div>
        <Button
          onClick={() => {
            handleClick({ title: "PLAY", desc: "play button clicked" });
            if (!playScene) {
              setPlayScene(true);
            }
          }}
        >
          play
          {/* {playScene === false ? (
            <PlayCircleFilledWhite />
          ) : (
            <PauseCircleOutlineIcon />
          )} */}
        </Button>
        {/* <IconButton onClick={() => setPlayScene(!playScene)}>{playScene === false ? <PlayCircleFilledWhite /> : <PauseCircleOutlineIcon />}</IconButton> */}
      </div>
      <div>
        <Button
          onClick={() => {
            handleClick({ title: "STOP IT", desc: "stop playback clicked" });
            setCurrentLineIndex(0);
            if (playScene) setPlayScene(false);
          }}
        >
          stop
          {/* <StopCircleIcon /> */}
        </Button>
      </div>
      <div>
        <Button
          onClick={() => {
            handleClick({
              title: "SKIP BACK",
              desc: "skip to prev line clicked",
            });
            setCurrentLineIndex(currentLineIndex - 1);
          }}
        >
          skip back
          {/* <SkipPreviousIcon /> */}
        </Button>
      </div>
      <div>
        <Button
          onClick={() => {
            handleClick({
              title: "SKIP FWD",
              desc: "skip to next line clicked",
            });
            setCurrentLineIndex(currentLineIndex + 1);
          }}
        >
          skip fwd
          {/* <SkipNextIcon /> */}
        </Button>
      </div>
    </div>
  );
}
