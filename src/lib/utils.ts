import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import fs from "fs";
import path from "path";
import { remark } from "remark";
import remarkParse from "remark-parse";

interface Scene {
  title: string;
  lines: { character: string; line: string }[];
}

interface Node {
  type: string;
  value?: string;
  depth?: number;
  children?: Node[];
}

export const mdToJSON = async (markdownContent: string): Promise<Scene> => {
  const file = await remark().use(remarkParse).process(markdownContent);
  const root = remark().use(remarkParse).parse(file.toString()) as unknown as {
    type: string;
    children: Node[];
  };

  const currentScene: Scene = { title: "", lines: [] };

  const processNode = (node: Node) => {
    if (node.type === "heading" && node.depth === 2 && node.children) {
      currentScene.title = node.children[0]?.value ?? "";
    }

    if (node.type === "paragraph" && node.children) {
      const [characterNode, ...lineNodes] = node.children;
      if (characterNode?.value) {
        const character = characterNode.value.replace(":", "").trim();
        const line = lineNodes
          .map((n) => n.value)
          .join("")
          .trim();
        currentScene.lines.push({ character, line });
      }
    }
  };

  root.children.forEach((node: Node) => processNode(node));

  const jsonOutput = JSON.stringify(currentScene, null, 2);
  const outputPath = path.join(process.cwd(), "output.json");

  fs.writeFileSync(outputPath, jsonOutput);

  return currentScene;
};
