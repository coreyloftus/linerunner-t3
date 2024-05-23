import { useEffect, useState } from "react";
// import JSONof6A from "./sceneData/6a.json";
// import ScriptDisplay from "./components/scriptDisplay";
// import SelectorDropdowns from "./components/selectorDropdowns";

export interface SceneData {
  project: string;
  scenes: Scene[];
}
export interface Scene {
  title: string;
  lines: Line[];
}
export interface Line {
  character: string;
  line: string;
}

export default function Home() {
  const [path, setPath] = useState("./sceneData/6a.md");
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [sceneOptions, setSceneOptions] = useState<string[]>([]);
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [selectedSceneTitle, setSelectedSceneTitle] = useState("");
  const [characterOptions, setCharacterOptions] = useState<string[]>([]);
  const [selectedChar, setSelectedChar] = useState("Hope");

  const [sceneData, setSceneData] = useState<SceneData[]>([]);

  const testCall = async () => {
    try {
      const res = await fetch("/api/convertMarkdown", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };
  const fetchMdData = async () => {
    try {
      const mdRes = await fetch("/api/convertMarkdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath: path,
        }),
      });
      const data = await mdRes.json();
      setSceneData(data);
      console.log(sceneData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      const projectScenes =
        JSONof6A.find((item) => item.project === selectedProject)?.scenes || [];
      setSceneOptions(projectScenes.map((scene) => scene.title));
      setSelectedSceneTitle(projectScenes[0]?.title || "");
    }
  }, [selectedProject]);
  useEffect(() => {
    if (selectedScene && selectedProject) {
      const characterList =
        JSONof6A.find((item) => item.project === selectedProject)
          ?.scenes?.find((scene) => scene.title === selectedScene)
          ?.lines.map((line) => line.character) || [];
      console.log({ characterOptions });
      setCharacterOptions(characterList);
    }
  }, []);

  useEffect(() => {
    console.log(`selectedProject: ${selectedProject}`);
    console.log(`selectedScene: ${selectedScene}`);
    console.log(`selectedChar: ${selectedChar}`);
  }, [selectedProject, selectedScene, selectedChar]);

  const dropdownProps = {
    selectedProject: selectedProject,
    selectedScene: selectedSceneTitle,
    selectedChar: selectedChar,
    setSelectedProject,
    setSelectedScene,
    setSelectedChar,
    scriptData: JSONof6A as SceneData[],
  };

  return (
    <div className="to[#555555] h-[100vh] bg-gradient-to-b from-[#1e1e1e] text-white">
      <Navbar />
      <SelectorDropdowns {...dropdownProps} />
      <div className="p2">
        <Paper>
          {/* <ScriptDisplay
            script={JSONof6A[0] as SceneData}
            userCharacter={selectedChar}
          /> */}
        </Paper>
      </div>
    </div>
  );
}
