import { type IconType } from "react-icons";
import { FaBookOpen, FaLayerGroup, FaMusic, FaPlay } from "react-icons/fa6";

export type AppMode = "runner" | "viewer" | "scripts" | "melody";

export const APP_MODES: {
  id: AppMode;
  label: string;
  short: string;
  icon: IconType;
}[] = [
  { id: "runner", label: "Line Runner", short: "Run", icon: FaPlay },
  { id: "viewer", label: "Line Viewer", short: "Read", icon: FaBookOpen },
  { id: "scripts", label: "Scripts", short: "Scripts", icon: FaLayerGroup },
  { id: "melody", label: "Melody", short: "Melody", icon: FaMusic },
];
