"use client";

import { FiMinus, FiPlus } from "react-icons/fi";

interface FontSizeControlProps {
  value: number; // percentage (75-125)
  onChange: (size: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function FontSizeControl({
  value,
  onChange,
  min = 75,
  max = 125,
  step = 5,
}: FontSizeControlProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - step);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + step);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-stone-600 dark:text-stone-400">
        Font Size
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrease}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-stone-100 text-stone-700 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          aria-label="Decrease font size"
        >
          <FiMinus className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-sm font-medium text-stone-800 dark:text-stone-200">
          {value}%
        </span>
        <button
          onClick={handleIncrease}
          disabled={value >= max}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-stone-100 text-stone-700 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          aria-label="Increase font size"
        >
          <FiPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
