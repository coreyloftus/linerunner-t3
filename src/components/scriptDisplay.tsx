import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Line, SceneData } from "../app/t3/page";
import ControlBar from "./ControlBar";

export default function ScriptDisplay(props: {
  script: SceneData;
  userCharacter: string;
}) {
  const { script, userCharacter } = props;
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playScene, setPlayScene] = useState(false);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [userInput, setUserInput] = useState("");

  const proceedWithScene = useCallback(() => {
    const lines = script.scenes[0].lines;
    const nextIndex = currentLineIndex + 1;
    if (nextIndex < lines.length) {
      const nextLine = lines[currentLineIndex + 1];
      if (nextLine.character === userCharacter) {
        setAwaitingInput(true);
      } else {
        setTimeout(
          () => setCurrentLineIndex((prevIndex) => prevIndex + 1),
          1000,
        );
      }
    } else {
      setPlayScene(false);
    }
  }, [currentLineIndex, script.scenes, userCharacter]);

  useEffect(() => {
    if (playScene && !awaitingInput) {
      proceedWithScene();
      console.log(
        `${currentLineIndex} | ${script.scenes[0].lines[currentLineIndex].character}: ${script.scenes[0].lines[currentLineIndex].line}`,
      );
    }
  }, [
    playScene,
    awaitingInput,
    proceedWithScene,
    currentLineIndex,
    script.scenes,
  ]);

  const handleSubmit = () => {
    console.log("User input submitted", userInput);
    const lines = script.scenes[0].lines;
    const nextLine = lines[currentLineIndex + 1];
    if (userInput.trim() === nextLine.line) {
      setAwaitingInput(false);
      setUserInput("");
      setCurrentLineIndex(currentLineIndex + 1);
    } else {
      console.log("User input does not match line -- try again");
      console.log(nextLine.line);
    }
  };

  return (
    <>
      <Box>
        <Typography variant="h4" align="center">
          {userCharacter}
        </Typography>
      </Box>
      <Box>
        <ControlBar
          playScene={playScene}
          setPlayScene={setPlayScene}
          setCurrentLineIndex={setCurrentLineIndex}
          currentLineIndex={currentLineIndex}
        />
      </Box>
      <List sx={{ maxHeight: "500px", overflowY: "scroll" }}>
        {playScene &&
          script.scenes[0].lines
            .slice(0, currentLineIndex + 1)
            .map((lines: Line, index: number) => (
              <ListItem
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <ListItemText
                  sx={{ fontWeight: "bold" }}
                  primary={`${lines.character.toUpperCase()}`}
                />
                <ListItemText secondary={`${lines.line}`} />
              </ListItem>
            ))}
      </List>

      <Box sx={{ display: "flex" }}>
        <TextField
          label="Your Line"
          variant="outlined"
          fullWidth
          margin="normal"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <Button variant="outlined" onClick={handleSubmit}>
          Submit
        </Button>
      </Box>
    </>
  );
}
