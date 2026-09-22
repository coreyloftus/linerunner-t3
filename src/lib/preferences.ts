import type { DisplayPreferences } from "~/app/context";

const PREFS_KEY = "linerunner-preferences";

const COLOR_PRESETS = [
  "default",
  "violet-400",
  "blue-400",
  "emerald-400",
  "rose-400",
  "amber-400",
  "cyan-400",
  "stone-400",
] as const;

export interface PlaybackPreferences {
  autoAdvanceOthers: boolean;
  wordIntervalMs: number;
  lineGapMs: number;
}

export interface UserPreferences {
  version: 1;
  display: DisplayPreferences;
  speechMatchEnabled: boolean;
  playback: PlaybackPreferences;
}

const DEFAULT_DISPLAY: DisplayPreferences = {
  ownCharacterColor: "default",
  otherCharacterColor: "default",
  sharedLineColor: "violet-400",
  fontSize: 100,
};

const DEFAULT_PLAYBACK: PlaybackPreferences = {
  autoAdvanceOthers: true,
  wordIntervalMs: 250,
  lineGapMs: 800,
};

export function defaultPreferences(): UserPreferences {
  return {
    version: 1,
    display: { ...DEFAULT_DISPLAY },
    speechMatchEnabled: false,
    playback: { ...DEFAULT_PLAYBACK },
  };
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function isColor(value: unknown): value is DisplayPreferences["ownCharacterColor"] {
  return (
    typeof value === "string" &&
    (COLOR_PRESETS as readonly string[]).includes(value)
  );
}

function normalizeDisplay(value: unknown): DisplayPreferences {
  const raw = value && typeof value === "object" ? (value as Partial<DisplayPreferences>) : {};
  return {
    ownCharacterColor: isColor(raw.ownCharacterColor)
      ? raw.ownCharacterColor
      : DEFAULT_DISPLAY.ownCharacterColor,
    otherCharacterColor: isColor(raw.otherCharacterColor)
      ? raw.otherCharacterColor
      : DEFAULT_DISPLAY.otherCharacterColor,
    sharedLineColor: isColor(raw.sharedLineColor)
      ? raw.sharedLineColor
      : DEFAULT_DISPLAY.sharedLineColor,
    // 300 matches the larger type ceiling, so a saved 300% is not clipped here.
    fontSize: clamp(raw.fontSize, 75, 300, DEFAULT_DISPLAY.fontSize),
  };
}

function normalizePlayback(value: unknown): PlaybackPreferences {
  const raw = value && typeof value === "object" ? (value as Partial<PlaybackPreferences>) : {};
  return {
    autoAdvanceOthers:
      typeof raw.autoAdvanceOthers === "boolean"
        ? raw.autoAdvanceOthers
        : DEFAULT_PLAYBACK.autoAdvanceOthers,
    wordIntervalMs: clamp(raw.wordIntervalMs, 80, 800, DEFAULT_PLAYBACK.wordIntervalMs),
    lineGapMs: clamp(raw.lineGapMs, 0, 3000, DEFAULT_PLAYBACK.lineGapMs),
  };
}

function normalize(value: unknown): UserPreferences {
  const raw = value && typeof value === "object" ? (value as Partial<UserPreferences>) : {};
  return {
    version: 1,
    display: normalizeDisplay(raw.display),
    speechMatchEnabled: raw.speechMatchEnabled === true,
    playback: normalizePlayback(raw.playback),
  };
}

function migrateLegacy(): UserPreferences {
  const defaults = defaultPreferences();
  if (typeof window === "undefined") return defaults;

  let display: unknown = defaults.display;
  try {
    const saved = localStorage.getItem("linerunner-display-preferences");
    if (saved) display = JSON.parse(saved) as unknown;
  } catch {
    display = defaults.display;
  }

  return normalize({
    version: 1,
    display,
    speechMatchEnabled: localStorage.getItem("linerunner-speech-match") === "true",
    playback: defaults.playback,
  });
}

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return defaultPreferences();
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return migrateLegacy();
    return normalize(JSON.parse(raw) as unknown);
  } catch {
    return defaultPreferences();
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(normalize(prefs)));
}
