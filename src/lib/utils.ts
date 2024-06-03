import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { remark } from "remark";
import remarkParse from "remark-parse";

export interface Line {
  character: string;
  line: string;
}

export interface Scene {
  title: string;
  lines: Line[];
}

export interface Project {
  project: string;
  scenes: Scene[];
}

interface Node {
  type: string;
  value?: string;
  depth?: number;
  children?: Node[];
}

export const mdToJSON = async (markdownContent: string): Promise<Project[]> => {
  const file = await remark().use(remarkParse).process(markdownContent);
  const root = remark().use(remarkParse).parse(file.toString()) as unknown as {
    type: string;
    children: Node[];
  };

  let projectTitle = "";
  const scenes: Scene[] = [];
  let currentScene: Scene | null = null;
  let currentCharacter: string | null = null;

  const processNode = (node: Node) => {
    if (node.type === "heading" && node.depth === 1 && node.children) {
      projectTitle = node.children[0]?.value ?? "Untitled Project";
    } else if (node.type === "heading" && node.depth === 2 && node.children) {
      if (currentScene) {
        scenes.push(currentScene);
      }
      currentScene = { title: node.children[0]?.value ?? "", lines: [] };
    } else if (node.type === "heading" && node.depth == 3 && node.children) {
      currentCharacter = node.children[0]?.value ?? "";
      console.log("currentLine", currentCharacter);
    } else if (
      node.type === "paragraph" &&
      node.children &&
      currentScene &&
      currentCharacter
    ) {
      const line = node.children
        .map((n) => n.value ?? "")
        .join("")
        .trim();
      currentScene.lines.push({ character: currentCharacter, line });
    }
  };

  root.children.forEach((node: Node) => processNode(node));
  if (currentScene) {
    scenes.push(currentScene);
  }

  return [
    {
      project: projectTitle,
      scenes: scenes,
    },
  ];
};
