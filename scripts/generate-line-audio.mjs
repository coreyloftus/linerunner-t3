// Usage: node --env-file=.env scripts/generate-line-audio.mjs <slug> [--scene "Act 1 Scene 3"] [--run]
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const [slug, ...flags] = process.argv.slice(2);
if (!slug) throw new Error("missing script slug");
const run = flags.includes("--run");
const sceneFlag = flags.indexOf("--scene");
const sceneFilter = sceneFlag >= 0 ? flags[sceneFlag + 1] : null;

const dir = "public/sceneData";
const outDir = `${dir}/audio/${slug}`;
const script = JSON.parse(await readFile(`${dir}/${slug}.json`, "utf8"));
const voices = JSON.parse(await readFile(`${dir}/${slug}.voices.json`, "utf8"));

// Must match lineAudioKey in src/lib/lineAudio.ts
const keyFor = (character, text) =>
  createHash("sha256")
    .update(`${character}::${text.trim().replace(/\s+/g, " ")}`)
    .digest("hex")
    .slice(0, 16);

const jobs = [];
for (const scene of script.scenes) {
  if (sceneFilter && scene.title !== sceneFilter) continue;
  for (const { characters, line, sung } of scene.lines) {
    const [character] = characters;
    if (characters.length !== 1 || sung || !voices[character]?.voiceId) continue;
    jobs.push({ character, text: line, key: keyFor(character, line) });
  }
}

const manifestPath = `${outDir}/manifest.json`;
const manifest = existsSync(manifestPath)
  ? JSON.parse(await readFile(manifestPath, "utf8"))
  : {};
const todo = jobs.filter((j) => !existsSync(`${outDir}/${j.key}.mp3`));
const chars = todo.reduce((n, j) => n + j.text.length, 0);
console.log(`${jobs.length} lines match, ${todo.length} to generate, ${chars} characters`);
if (!run) {
  console.log("dry run — pass --run to call ElevenLabs");
  process.exit(0);
}

const apiKey = process.env.ELEVEN_LABS_KEY;
if (!apiKey) throw new Error("ELEVEN_LABS_KEY is not set");
await mkdir(outDir, { recursive: true });

for (const job of jobs) {
  const file = `${job.key}.mp3`;
  if (existsSync(`${outDir}/${file}`)) {
    manifest[job.key] = file;
    continue;
  }
  const { voiceId, modelId = "eleven_multilingual_v2" } = voices[job.character];
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text: job.text, model_id: modelId }),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  await writeFile(`${outDir}/${file}`, Buffer.from(await res.arrayBuffer()));
  manifest[job.key] = file;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`${job.character}: ${job.text.slice(0, 50)}`);
}
