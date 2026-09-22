"use client";

import { useContext } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";
import { ScriptContext } from "~/app/context";
import type { PlaybackPreferences } from "~/lib/preferences";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

function Stepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-stone-600 dark:text-stone-400">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-stone-100 text-stone-700 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          aria-label={`Decrease ${label}`}
        >
          <FiMinus className="h-4 w-4" />
        </button>
        <span className="w-16 text-center text-sm font-medium text-stone-800 dark:text-stone-200">
          {value} ms
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-stone-100 text-stone-700 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          aria-label={`Increase ${label}`}
        >
          <FiPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PlaybackSettings() {
  const { playbackPreferences, setPlaybackPreferences } = useContext(ScriptContext);

  const setPlayback = (patch: Partial<PlaybackPreferences>) => {
    setPlaybackPreferences((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-mobile-sm iphone:text-sm">
            Auto-advance other lines
          </Label>
          <p className="text-xs text-muted-foreground">
            Pause only on your lines. Everyone else reads through.
          </p>
        </div>
        <Switch
          checked={playbackPreferences.autoAdvanceOthers}
          onCheckedChange={(checked) => setPlayback({ autoAdvanceOthers: checked })}
          aria-label="Auto-advance other lines"
        />
      </div>
      {playbackPreferences.autoAdvanceOthers && (
        <div className="flex flex-col gap-3 pt-1">
          <Stepper
            label="Word speed"
            value={playbackPreferences.wordIntervalMs}
            min={80}
            max={800}
            step={20}
            onChange={(wordIntervalMs) => setPlayback({ wordIntervalMs })}
          />
          <Stepper
            label="Pause between lines"
            value={playbackPreferences.lineGapMs}
            min={0}
            max={3000}
            step={100}
            onChange={(lineGapMs) => setPlayback({ lineGapMs })}
          />
        </div>
      )}
    </div>
  );
}
