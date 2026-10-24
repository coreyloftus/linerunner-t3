import { useEffect, useRef, type RefObject } from "react";

const EDGE_MIN = 24; // stay clear of the browser's own back-swipe
const EDGE_MAX = 64;
const SLOP = 10;
const DESKTOP_QUERY = "(min-width: 768px)";

type Options = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drawerRef: RefObject<HTMLElement | null>;
  backdropRef: RefObject<HTMLElement | null>;
};

// Drag the phone drawer with a finger: open from just inside the left edge, close by swiping left
export function useDrawerSwipe({
  open,
  onOpenChange,
  drawerRef,
  backdropRef,
}: Options) {
  const openRef = useRef(open);
  const changeRef = useRef(onOpenChange);
  useEffect(() => {
    openRef.current = open;
    changeRef.current = onOpenChange;
  });

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let width = 0;
    let mode: "idle" | "tracking" | "dragging" = "idle";
    let wasOpen = false;

    const paint = (progress: number) => {
      const drawer = drawerRef.current;
      const backdrop = backdropRef.current;
      if (!drawer || !backdrop) return;
      drawer.style.transition = "none";
      drawer.style.visibility = "visible";
      drawer.style.transform = `translateX(${(progress - 1) * width}px)`;
      backdrop.style.transition = "none";
      backdrop.style.opacity = String(progress);
    };

    const release = () => {
      for (const el of [drawerRef.current, backdropRef.current]) {
        if (!el) continue;
        el.style.transition = "";
        el.style.transform = "";
        el.style.visibility = "";
        el.style.opacity = "";
      }
    };

    const progressAt = (x: number) => {
      const base = wasOpen ? 1 : 0;
      return Math.min(1, Math.max(0, base + (x - startX) / width));
    };

    const onStart = (event: TouchEvent) => {
      if (window.matchMedia(DESKTOP_QUERY).matches) return;
      if (event.touches.length !== 1 || !drawerRef.current) return;
      const touch = event.touches[0]!;
      wasOpen = openRef.current;
      if (!wasOpen && (touch.clientX < EDGE_MIN || touch.clientX > EDGE_MAX))
        return;
      startX = lastX = touch.clientX;
      startY = touch.clientY;
      lastT = event.timeStamp;
      velocity = 0;
      width = drawerRef.current.offsetWidth;
      mode = "tracking";
    };

    const onMove = (event: TouchEvent) => {
      if (mode === "idle") return;
      const touch = event.touches[0]!;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (mode === "tracking") {
        if (Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx)) {
          mode = "idle"; // vertical scroll wins
          return;
        }
        const wantsOpen = !wasOpen && dx > SLOP;
        const wantsClose = wasOpen && dx < -SLOP;
        if (!wantsOpen && !wantsClose) return;
        mode = "dragging";
        startX = touch.clientX; // the drawer starts moving from the finger, not the slop
      }
      const dt = event.timeStamp - lastT;
      if (dt > 0) velocity = (touch.clientX - lastX) / dt;
      lastX = touch.clientX;
      lastT = event.timeStamp;
      paint(progressAt(touch.clientX));
    };

    const onEnd = () => {
      if (mode === "dragging") {
        const next =
          Math.abs(velocity) > 0.4 ? velocity > 0 : progressAt(lastX) > 0.5;
        release();
        if (next !== openRef.current) changeRef.current(next);
      }
      mode = "idle";
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [drawerRef, backdropRef]);
}
