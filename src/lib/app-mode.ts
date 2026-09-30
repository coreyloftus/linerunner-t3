import { type IconType } from "react-icons";
import { FaBookOpen, FaLayerGroup, FaMusic, FaPlay } from "react-icons/fa6";

export type AppMode = "runner" | "viewer" | "scripts" | "melody";

export const APP_MODES: { id: AppMode; label: string; icon: IconType }[] = [
  { id: "runner", label: "Line Runner", icon: FaPlay },
  { id: "viewer", label: "Line Viewer", icon: FaBookOpen },
  { id: "scripts", label: "Scripts", icon: FaLayerGroup },
  { id: "melody", label: "Melody", icon: FaMusic },
];
