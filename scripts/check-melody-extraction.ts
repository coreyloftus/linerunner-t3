/**
 * Manual accuracy check for melody extraction (not a CI test).
 *
 * Sends fixtures/melody/twinkle.pdf through extractMelody and prints a
 * per-note diff against fixtures/melody/expected.json.
 *
 * Usage (needs ANTHROPIC_API_KEY in .env):
 *   npx tsx scripts/check-melody-extraction.ts [path/to.pdf] [path/to/expected.json]
 */

import "dotenv/config";
import * as fs from "fs";
import type { MelodyNote } from "~/lib/melody";

const pdfPath = process.argv[2] ?? "fixtures/melody/twinkle.pdf";
const expectedPath = process.argv[3] ?? "fixtures/melody/expected.json";

interface Expected {
  title: string;
  tempoBpm: number;
  timeSignature: [number, number];
  notes: MelodyNote[];
}

const normLyric = (s?: string) =>
  (s ?? "").toLowerCase().replace(/[^a-z'-]/g, "");

const fmt = (n?: MelodyNote) =>
  n ? `${n.pitch ?? "rest"} ${n.beats} ${n.lyric ?? "·"}`.padEnd(22) : "—".padEnd(22);

async function main() {
  const { extractMelody } = await import("~/server/melodyExtraction");
  const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as Expected;
  const pdf = fs.readFileSync(pdfPath).toString("base64");

  const started = Date.now();
  const { melody, warnings } = await extractMelody(pdf, pdfPath.split("/").pop());
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`Model: ${melody.extractionModel} (${seconds}s)`);
  console.log(`Title: ${melody.title}  (expected ${expected.title})`);
  console.log(`Tempo: ${melody.tempoBpm}  (expected ${expected.tempoBpm})`);
  console.log(
    `Time:  ${melody.timeSignature.join("/")}  (expected ${expected.timeSignature.join("/")})`,
  );
  console.log(`Notes: ${melody.notes.length}  (expected ${expected.notes.length})\n`);

  let pitchOk = 0;
  let beatsOk = 0;
  let lyricOk = 0;
  const count = Math.max(expected.notes.length, melody.notes.length);
  console.log("  #  m  expected               got                    diff");
  for (let i = 0; i < count; i++) {
    const e = expected.notes[i];
    const g = melody.notes[i];
    const diffs: string[] = [];
    if (e && g) {
      if (e.pitch === g.pitch) pitchOk++;
      else diffs.push("pitch");
      if (Math.abs(e.beats - g.beats) < 1e-6) beatsOk++;
      else diffs.push("beats");
      if (normLyric(e.lyric) === normLyric(g.lyric)) lyricOk++;
      else diffs.push("lyric");
    } else {
      diffs.push(e ? "missing" : "extra");
    }
    console.log(
      `${String(i + 1).padStart(3)} ${String(e?.measure ?? g?.measure ?? "").padStart(2)}  ${fmt(e)} ${fmt(g)} ${diffs.join(",")}`,
    );
  }

  const pct = (n: number) => `${((n / expected.notes.length) * 100).toFixed(1)}%`;
  console.log(`\nPitch accuracy: ${pct(pitchOk)} (${pitchOk}/${expected.notes.length})`);
  console.log(`Beats accuracy: ${pct(beatsOk)} (${beatsOk}/${expected.notes.length})`);
  console.log(`Lyric accuracy: ${pct(lyricOk)} (${lyricOk}/${expected.notes.length})`);
  if (warnings.length) console.log(`\nWarnings:\n- ${warnings.join("\n- ")}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
