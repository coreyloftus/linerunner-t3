"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export default function ScriptBox(props: {
  // script: SceneData;
  // userCharacter: string;
}) {
  // const { script, userCharacter } = props;
  // const [currentLineIndex, setCurrentLineIndex] = useState(0);
  // const [playScene, setPlayScene] = useState(false);
  // const [awaitingInput, setAwaitingInput] = useState(false);
  const [userInput, setUserInput] = useState("");

  // const proceedWithScene = useCallback(() => {
  //   const lines = script.scenes[0].lines;
  //   const nextIndex = currentLineIndex + 1;
  //   if (nextIndex < lines.length) {
  //     const nextLine = lines[currentLineIndex + 1];
  //     if (nextLine.character === userCharacter) {
  //       setAwaitingInput(true);
  //     } else {
  //       setTimeout(
  //         () => setCurrentLineIndex((prevIndex) => prevIndex + 1),
  //         1000,
  //       );
  //     }
  //   } else {
  //     setPlayScene(false);
  //   }
  // }, [currentLineIndex, script.scenes, userCharacter]);

  // useEffect(() => {
  //   if (playScene && !awaitingInput) {
  //     proceedWithScene();
  //     console.log(
  //       `${currentLineIndex} | ${script.scenes[0].lines[currentLineIndex].character}: ${script.scenes[0].lines[currentLineIndex].line}`,
  //     );
  //   }
  // }, [
  //   playScene,
  //   awaitingInput,
  //   proceedWithScene,
  //   currentLineIndex,
  //   script.scenes,
  // ]);

  const handleSubmit = () => {
    console.log("User input submitted", userInput);
    // const lines = script.scenes[0].lines;
    // const nextLine = lines[currentLineIndex + 1];
    // if (userInput.trim() === nextLine.line) {
    //   setAwaitingInput(false);
    //   setUserInput("");
    //   setCurrentLineIndex(currentLineIndex + 1);
    // } else {
    //   console.log("User input does not match line -- try again");
    //   console.log(nextLine.line);
    // }
  };

  return (
    <>
      <div>
        <p className="text-center text-xl">
          {/* {userCharacter} */}
          userCharacter here
        </p>
      </div>
      <div>
        {/* <ControlBar
            playScene={playScene}
            setPlayScene={setPlayScene}
            setCurrentLineIndex={setCurrentLineIndex}
            currentLineIndex={currentLineIndex}
          /> */}
      </div>
      <div className="mb-2 min-h-[30vh] overflow-y-scroll rounded-md border-2 border-zinc-400">
        <ul className="">
          {/* {playScene &&
            script.scenes[0].lines
              .slice(0, currentLineIndex + 1)
              .map((lines: Line, index: number) => (
                <li
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                <p
                    className="text-bold"}
                >{`${lines.character.toUpperCase()}`}</p>
                <ListItemText secondary={`${lines.line}`} />
                </li>
              ))} */}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Your line..."
        />
        <div className="">
          <Button
            variant="outline"
            onClick={handleSubmit}
            className="text-[#010101]"
          >
            Submit
          </Button>
        </div>
      </div>
    </>
  );
}
