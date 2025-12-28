"use client";

import { useContext } from "react";
import { ScriptContext, type ColorPreset } from "~/app/context";
import { ColorSwatchPicker } from "./ui/color-swatch-picker";
import { FontSizeControl } from "./ui/font-size-control";

export function DisplaySettings() {
  const { displayPreferences, setDisplayPreferences } =
    useContext(ScriptContext);

  const handleColorChange = (
    key: "ownCharacterColor" | "otherCharacterColor" | "sharedLineColor",
  ) => {
    return (color: ColorPreset) => {
      setDisplayPreferences((prev) => ({
        ...prev,
        [key]: color,
      }));
    };
  };

  const handleFontSizeChange = (size: number) => {
    setDisplayPreferences((prev) => ({
      ...prev,
      fontSize: size,
    }));
  };

  return (
    <div className="flex flex-col gap-3">
      <ColorSwatchPicker
        label="Your Lines"
        value={displayPreferences.ownCharacterColor}
        onChange={handleColorChange("ownCharacterColor")}
      />
      <ColorSwatchPicker
        label="Other Characters"
        value={displayPreferences.otherCharacterColor}
        onChange={handleColorChange("otherCharacterColor")}
      />
      <ColorSwatchPicker
        label="Shared Lines"
        value={displayPreferences.sharedLineColor}
        onChange={handleColorChange("sharedLineColor")}
      />
      <FontSizeControl
        value={displayPreferences.fontSize}
        onChange={handleFontSizeChange}
      />
    </div>
  );
}
