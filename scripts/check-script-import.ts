/**
 * Checks parseScriptResponse against a sample Claude response (no API call).
 *
 * Usage: npx tsx --test scripts/check-script-import.ts
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { parseScriptResponse } from "../src/lib/script-import";
import { SCRIPT_LIMITS } from "../src/lib/script-limits";

const sample = {
  title: "  The Importance of Being Earnest ",
  scenes: [
    {
      title: "Act 1",
      lines: [
        { characters: ["ALGERNON"], line: "Did you hear what I was playing, Lane?", sung: false },
        { characters: ["LANE"], line: "I didn't think it polite\n to listen, sir.", sung: false },
        { characters: ["ALGERNON", "ALGERNON"], line: "   ", sung: false },
        { characters: ["JACK", " GWENDOLEN "], line: "Ernest! / My own Ernest!", sung: true },
      ],
    },
    { title: "", lines: [{ characters: ["LANE"], line: "Yes, sir.", sung: false }] },
    { title: "Empty", lines: [] },
  ],
  warnings: ["Page 3 was hard to read.", " "],
};

test("maps a Claude response to the script shape", () => {
  const { show, warnings } = parseScriptResponse(JSON.stringify(sample), "earnest.pdf");
  assert.equal(show.project, "The Importance of Being Earnest");
  assert.deepEqual(
    show.scenes.map((s) => s.title),
    ["Act 1", "Scene 2"],
  );
  assert.deepEqual(show.scenes[0]!.lines, [
    { characters: ["ALGERNON"], line: "Did you hear what I was playing, Lane?" },
    { characters: ["LANE"], line: "I didn't think it polite to listen, sir." },
    { characters: ["JACK", "GWENDOLEN"], line: "Ernest! / My own Ernest!", sung: true },
  ]);
  assert.deepEqual(show.characters, ["ALGERNON", "LANE", "JACK", "GWENDOLEN"]);
  assert.deepEqual(warnings, ["Page 3 was hard to read."]);
});

test("falls back to the file name for an untitled show", () => {
  const { show } = parseScriptResponse(
    JSON.stringify({ ...sample, title: "" }),
    "My Show.pdf",
  );
  assert.equal(show.project, "My Show");
});

test("splits an oversized scene and clips long lines", () => {
  const lines = Array.from({ length: SCRIPT_LIMITS.maxLinesPerScene + 5 }, (_, i) => ({
    characters: ["A"],
    line: i === 0 ? "x".repeat(SCRIPT_LIMITS.maxLineChars + 10) : `Line ${i}`,
    sung: false,
  }));
  const { show, warnings } = parseScriptResponse(
    JSON.stringify({ title: "Big", scenes: [{ title: "Finale", lines }], warnings: [] }),
  );
  assert.deepEqual(
    show.scenes.map((s) => [s.title, s.lines.length]),
    [
      ["Finale (part 1)", SCRIPT_LIMITS.maxLinesPerScene],
      ["Finale (part 2)", 5],
    ],
  );
  assert.equal(show.scenes[0]!.lines[0]!.line.length, SCRIPT_LIMITS.maxLineChars);
  assert.equal(warnings.length, 2);
});

test("rejects bad JSON, a wrong shape, and an empty script", () => {
  assert.throws(() => parseScriptResponse("{not json"), /unreadable/);
  assert.throws(() => parseScriptResponse(JSON.stringify({ title: "x" })), /unexpected shape/);
  assert.throws(
    () => parseScriptResponse(JSON.stringify({ title: "x", scenes: [], warnings: [] })),
    /Could not find any lines/,
  );
});

test("rejects a show over the scene limit", () => {
  const scenes = Array.from({ length: SCRIPT_LIMITS.maxScenesPerShow + 1 }, (_, i) => ({
    title: `S${i}`,
    lines: [{ characters: ["A"], line: "Hi", sung: false }],
  }));
  assert.throws(
    () => parseScriptResponse(JSON.stringify({ title: "x", scenes, warnings: [] })),
    /scenes; the limit is/,
  );
});
