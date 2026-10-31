"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LuPanelLeft } from "react-icons/lu";

const HIDE_AFTER_MS = 3000;
const EDGE_PX = 120;

type Chrome = {
  hidden: boolean;
  setPlaying: (playing: boolean) => void;
  // True right after a tap that brought the controls back, so the tap does not also advance
  justWoke: () => boolean;
  openSidebar: () => void;
};

const ChromeContext = createContext<Chrome>({
  hidden: false,
  setPlaying: () => undefined,
  justWoke: () => false,
  openSidebar: () => undefined,
});

export const useChrome = () => useContext(ChromeContext);

// Classes for anything that fades away while a scene plays
export const chromeFade = (hidden: boolean) =>
  `transition-[opacity,visibility] duration-500 ${hidden ? "invisible opacity-0" : "visible opacity-100"}`;

const inWakeZone = (x: number, y: number) =>
  y < EDGE_PX ||
  y > window.innerHeight - EDGE_PX ||
  x > window.innerWidth - EDGE_PX;

// While a scene plays, bars and controls fade after a few seconds; a tap near an edge brings them back
export function ChromeProvider({
  children,
  openSidebar,
}: {
  children: ReactNode;
  openSidebar: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hiddenRef = useRef(false);
  const wokeAt = useRef(0);
  hiddenRef.current = hidden;

  const wake = useCallback(() => {
    if (hiddenRef.current) wokeAt.current = Date.now();
    setHidden(false);
    clearTimeout(timer.current);
    if (playing) {
      timer.current = setTimeout(() => setHidden(true), HIDE_AFTER_MS);
    }
  }, [playing]);

  useEffect(() => {
    wake();
    return () => clearTimeout(timer.current);
  }, [wake]);

  useEffect(() => {
    if (!playing) return;
    const onPointerDown = (event: PointerEvent) => {
      const onChrome = (event.target as HTMLElement).closest("[data-chrome]");
      if (onChrome !== null || inWakeZone(event.clientX, event.clientY)) wake();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse") wake();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [playing, wake]);

  const justWoke = useCallback(() => Date.now() - wokeAt.current < 500, []);

  return (
    <ChromeContext.Provider
      value={{ hidden, setPlaying, justWoke, openSidebar }}
    >
      {children}
    </ChromeContext.Provider>
  );
}

// Opens the sidebar drawer on phones and tablets; desktop keeps the sidebar on screen
export function SidebarButton({ floating = false }: { floating?: boolean }) {
  const { openSidebar } = useChrome();
  return (
    <button
      type="button"
      onClick={openSidebar}
      aria-label="Show sidebar"
      title="Show sidebar"
      className={`press flex h-11 w-11 flex-shrink-0 touch-manipulation items-center justify-center rounded-full text-accent desk:hidden ${floating ? "glass pointer-events-auto" : ""}`}
    >
      <LuPanelLeft className="h-[22px] w-[22px]" />
    </button>
  );
}
