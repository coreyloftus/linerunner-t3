"use client";

import { type ColorPreset } from "~/app/context";

interface ColorSwatchPickerProps {
  value: ColorPreset;
  onChange: (color: ColorPreset) => void;
  label: string;
}

// Color options with their display properties
const COLOR_OPTIONS: { value: ColorPreset; bgClass: string; label: string }[] =
  [
    { value: "default", bgClass: "bg-stone-400", label: "Default" },
    { value: "violet-400", bgClass: "bg-violet-400", label: "Violet" },
    { value: "blue-400", bgClass: "bg-blue-400", label: "Blue" },
    { value: "emerald-400", bgClass: "bg-emerald-400", label: "Green" },
    { value: "rose-400", bgClass: "bg-rose-400", label: "Rose" },
    { value: "amber-400", bgClass: "bg-amber-400", label: "Amber" },
    { value: "cyan-400", bgClass: "bg-cyan-400", label: "Cyan" },
  ];

export function ColorSwatchPicker({
  value,
  onChange,
  label,
}: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-stone-600 dark:text-stone-400">{label}</span>
      <div className="flex gap-1.5">
        {COLOR_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`h-6 w-6 rounded-full transition-all duration-150 ${option.bgClass} ${
              value === option.value
                ? "ring-2 ring-stone-900 ring-offset-2 dark:ring-stone-100 dark:ring-offset-stone-900"
                : "hover:scale-110"
            }`}
            title={option.label}
            aria-label={`Select ${option.label} color`}
          />
        ))}
      </div>
    </div>
  );
}
