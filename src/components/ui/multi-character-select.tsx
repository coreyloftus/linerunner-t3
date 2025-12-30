"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { IoClose, IoChevronDown, IoAdd } from "react-icons/io5";

interface MultiCharacterSelectProps {
  value: string[];
  onChange: (characters: string[]) => void;
  availableCharacters: string[];
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function MultiCharacterSelect({
  value,
  onChange,
  availableCharacters,
  placeholder = "Select character(s)",
  className,
  error,
}: MultiCharacterSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [newCharacter, setNewCharacter] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const toggleCharacter = (character: string) => {
    if (value.includes(character)) {
      onChange(value.filter((c) => c !== character));
    } else {
      onChange([...value, character]);
    }
  };

  const removeCharacter = (character: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((c) => c !== character));
  };

  const addNewCharacter = () => {
    const trimmed = newCharacter.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setNewCharacter("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewCharacter();
    }
  };

  // Get unique available characters that aren't already selected
  const unselectedCharacters = availableCharacters.filter(
    (c) => !value.includes(c)
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Selected characters display / trigger */}
      <div
        onClick={() => setOpen(!open)}
        className={cn(
          "flex min-h-[36px] cursor-pointer flex-wrap items-center gap-1 rounded-md border bg-stone-100 px-2 py-1.5 text-sm transition-colors dark:bg-stone-800",
          error
            ? "border-red-500"
            : "border-stone-200 hover:border-stone-400 dark:border-stone-700 dark:hover:border-stone-500",
          open && "ring-2 ring-stone-400 dark:ring-stone-500"
        )}
      >
        {value.length === 0 ? (
          <span className="text-stone-400">{placeholder}</span>
        ) : (
          value.map((character) => (
            <span
              key={character}
              className="inline-flex items-center gap-1 rounded bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-200"
            >
              {character}
              <button
                type="button"
                onClick={(e) => removeCharacter(character, e)}
                className="rounded-full p-0.5 hover:bg-stone-300 dark:hover:bg-stone-600"
              >
                <IoClose className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
        <IoChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-stone-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[200px] overflow-auto rounded-md border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800">
          {/* Add new character input */}
          <div className="sticky top-0 border-b border-stone-200 bg-white p-2 dark:border-stone-700 dark:bg-stone-800">
            <div className="flex gap-1">
              <input
                ref={inputRef}
                type="text"
                value={newCharacter}
                onChange={(e) => setNewCharacter(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add new character..."
                className="flex-1 rounded border border-stone-200 bg-stone-50 px-2 py-1 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
              />
              <button
                type="button"
                onClick={addNewCharacter}
                disabled={!newCharacter.trim()}
                className="rounded bg-stone-200 p-1 text-stone-600 hover:bg-stone-300 disabled:opacity-50 dark:bg-stone-600 dark:text-stone-300 dark:hover:bg-stone-500"
              >
                <IoAdd className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Available characters list */}
          {availableCharacters.length > 0 ? (
            <div className="p-1">
              {availableCharacters.map((character) => (
                <button
                  key={character}
                  type="button"
                  onClick={() => toggleCharacter(character)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors",
                    value.includes(character)
                      ? "bg-stone-200 text-stone-900 dark:bg-stone-600 dark:text-stone-100"
                      : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      value.includes(character)
                        ? "border-stone-500 bg-stone-500 text-white dark:border-stone-400 dark:bg-stone-400"
                        : "border-stone-300 dark:border-stone-600"
                    )}
                  >
                    {value.includes(character) && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  {character}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-sm text-stone-400">
              No characters yet. Add one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
