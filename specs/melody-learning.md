# Melody learning: sheet music PDF to a piano practice track

## Instructions to the executing agent

Read this entire document before writing any code.

Work autonomously. Make reasonable decisions without checking in. Items marked **recommended** may be overridden with good reason. Items marked **locked** may not.

Finish by creating a fresh branch off `main`, committing with conventional commits, and opening a PR against `main`. This repo has no `dev` branch. Remote HEAD is `origin/main`. Do not commit to `main` directly. Do not force-push.

Suggested branch: `feat/melody-learning`.

There is no project test suite. Proof is the Verification section: upload a real PDF, hear the melody, save it, reload it. `npm run lint` must pass before the PR.

## Goal

An actor uploads a PDF of a song's vocal line: one staff, single notes, lyrics under the notes. LineRunner reads the notes, rhythm, and lyrics, shows them for review and correction, and saves them as a melody. The actor plays the melody back as a simple piano tone in correct rhythm, with the current lyric highlighted, at an adjustable tempo, looping a passage if they want. The purpose is to learn a show's melodies. This round ships a standalone Melody tab. A later round shows the melody inline while a song plays in the runner, so each saved melody can already be linked to a song section.

## Context & Constraints

Stack: Next.js 16 App Router, React 19, tRPC 11 (`src/server/api/root.ts`), NextAuth, Firestore via `src/server/firebase.ts` (`FirestoreService`) and `src/lib/firebase-admin.ts`, Tailwind, Radix. Env vars are validated in `src/env.js`. The app deploys to Vercel, so a request body must stay under 4.5 MB.

UI follows the "Prompt Book" design system: token classes (`bg-surface`, `text-muted-foreground`, `bg-accent`, `border-border`), `font-display` / `font-script`, small-caps letterspaced section labels. Tokens are in `src/styles/globals.css`. Do not add new colors or fonts.

### What exists

- Tabs: `src/components/AppContent.tsx` defines `runner`, `viewer`, `scripts` tabs with Radix `Tabs`.
- File input with drag and drop: `src/components/FileDropZone.tsx` (takes `acceptedTypes`). Reuse it for the PDF.
- Per-user Firestore data lives under `users/{uid}/...`. `FirestoreService` has `getUserDocuments`, `addUserDocument`, `updateUserDocument`, `deleteDocument`. Scripts use the `uploaded_data` subcollection. Follow the same pattern.
- Preferences: `src/lib/preferences.ts` owns one versioned `localStorage` document (`linerunner-preferences`) and normalizes every field. The inline-song toggle in the later round goes there. This round does not add it.
- Script sections: `SceneJSON` in `src/server/scriptService.ts` (`title`, `lines`). The continuous-script spec (`specs/continuous-script.md`) adds `kind?: "scene" | "song"`. If that field exists when you start, filter the link picker to songs. If not, list all sections.
- A stubbed paid-API feature with a feature flag and caching: `src/server/api/routers/voice.ts`. Copy its pattern for env-gating.

### Locked decisions

| Topic | Decision |
|---|---|
| What is stored | The melody as structured note data (JSON) in Firestore. Audio is synthesized in the browser at play time. Do not store audio files. This keeps tempo, octave, and corrections free to change after upload. |
| PDF → notes | Server-side call to the Claude API with the PDF as a `document` content block, forced tool use with a JSON schema for the notes. Validate the result with zod before returning it. |
| Review before save | The extracted notes always open in an editable review screen before save. Extraction is never saved blind. |
| Audio engine | `tone` (Tone.js) with a `Tone.Sampler` loaded from piano samples self-hosted in `public/audio/piano/`. No runtime CDN for samples. |
| Scope of input | One staff, one note at a time (rests allowed), lyrics under notes. Reject or warn on anything else; do not attempt chords or multiple staves. |
| Auth | Upload, extraction, and save require sign-in (`protectedProcedure`). |
| Placement | Standalone Melody tab this round. No change to the runner or viewer. |

### Melody data model

Create `src/lib/melody.ts` with the types and zod schemas. Both server and client import it.

```ts
export interface MelodyNote {
  pitch: string | null;  // scientific pitch, e.g. "C4", "F#4", "Bb3"; null = rest
  beats: number;         // duration in quarter-note beats: 1 = quarter, 0.5 = eighth, 1.5 = dotted quarter
  lyric?: string;        // syllable under this note, hyphen kept for split words ("hap-")
  tieToNext?: boolean;   // tie into the next note of the same pitch
  measure: number;       // 1-based measure number
}

export interface Melody {
  id: string;
  title: string;
  tempoBpm: number;              // quarter notes per minute
  timeSignature: [number, number];
  keySignature?: string;         // e.g. "Eb major", display only
  pickupBeats?: number;          // anacrusis length, 0 when none
  notes: MelodyNote[];
  link?: {                       // for the later inline-in-runner round
    projectName: string;
    source: "local" | "public" | "shared" | "user";
    sectionTitle: string;
  };
  sourceFileName: string;
  extractionModel: string;
  createdAt: string;             // ISO
  updatedAt: string;
}
```

Store in `users/{uid}/melodies/{id}`.

### Do not touch

- Runner, viewer, and playback code in `src/components/ScriptDisplay/`, `src/components/ScriptViewer.tsx`, `src/hooks/`.
- `src/lib/preferences.ts` (no new preference this round).
- `src/server/api/routers/voice.ts`.
- Do not commit copyrighted sheet music. Test fixtures must be public domain.

## Non-Goals

- Showing the melody inside the runner or viewer during a song, and the preference toggle for it. That is the next round. The `link` field exists so that round needs no data migration.
- Chords, piano accompaniment, multiple staves, multiple voices, harmony parts.
- Dynamics, articulations, fermatas, repeats, D.S./coda jumps. Unroll nothing: play the notes in page order. (A repeat sign may be noted in the review screen as a warning.)
- Tempo changes within a song. One tempo per melody.
- Exporting MusicXML or MIDI. A WAV download is in scope; other formats are not.
- Sharing melodies between users or publishing public melodies.
- Recording the user's own voice.

## Implementation Plan

### 1. Dependencies and env

- `npm install tone @anthropic-ai/sdk`.
- `src/env.js`: add server vars `ANTHROPIC_API_KEY` (optional string) and `MELODY_EXTRACTION_MODEL` (optional string, default `claude-opus-5-5` in code). Add them to `.env.example` if one exists.
- When `ANTHROPIC_API_KEY` is missing, the extraction procedure returns a clear `PRECONDITION_FAILED` tRPC error. The UI shows "Melody import is not configured" and still lets users play and edit saved melodies.

### 2. Piano samples

- Download a subset of the Salamander Grand Piano samples (CC-BY 3.0, published with Tone.js at `https://tonejs.github.io/audio/salamander/`) covering A1 to C7 at every minor third (`A1, C2, Ds2, Fs2, A2, … C7`, `.mp3`). Save to `public/audio/piano/`.
- Add `public/audio/piano/ATTRIBUTION.md` naming the source and license.

### 3. Types and schemas

- Create `src/lib/melody.ts` with the model above, a zod `melodySchema`, a zod `melodyNoteSchema`, and helpers:
  - `noteStartBeats(notes): number[]` (cumulative beat offsets).
  - `transpose(pitch, semitones): string` for octave shift (only ±12 is used in UI).
  - `validateMelody(m): string[]` returning human-readable warnings: measures whose beats do not sum to the time signature (skip measure 1 when `pickupBeats > 0`), pitches outside C2–C7, empty notes list.

### 4. Extraction router

Create `src/server/api/routers/melody.ts` and register it as `melody` in `src/server/api/root.ts`.

Procedures (all `protectedProcedure`):

| Procedure | Input | Behavior |
|---|---|---|
| `extractFromPdf` | `{ fileName: string, pdfBase64: string }` | Reject over 3 MB decoded (keeps base64 under the 4.5 MB body limit) or not a PDF (`%PDF` magic bytes). Call Claude. Return `{ melody: Omit<Melody, "id" \| "createdAt" \| "updatedAt">, warnings: string[] }`. Do not save. |
| `list` | none | The user's melodies, newest first, without `notes` (id, title, link, updatedAt, note count). |
| `get` | `{ id }` | One full melody. |
| `save` | `melodySchema` minus timestamps, optional `id` | Create or update. Set timestamps server-side. Validate with zod. |
| `delete` | `{ id }` | Delete. |

Extraction call (keep it in a function `extractMelody(pdfBase64)` in the same file):
- `messages.create` with `model = env.MELODY_EXTRACTION_MODEL ?? "claude-opus-5-5"`, a `document` block (`source: { type: "base64", media_type: "application/pdf", data }`), and one text block with the instructions below.
- One tool `record_melody` whose `input_schema` is the JSON Schema of `{ title, tempoBpm, timeSignature, keySignature, pickupBeats, notes[], warnings[] }`. Force it with `tool_choice: { type: "tool", name: "record_melody" }`.
- Prompt instructions, in substance: read the single vocal staff; read every note and rest left to right, top system to bottom, page order; give pitch in scientific notation applying the clef, key signature, and accidentals carried through the measure; give duration in quarter-note beats including dots; attach each lyric syllable to the note it sits under, keep hyphens, leave melisma continuation notes without a lyric; mark ties; take tempo from the tempo marking (metronome mark if present, otherwise map the Italian term to a typical BPM, else 100); if the part is written in treble clef with an 8 below or is marked for a male voice, report sounding pitch; put anything uncertain or unsupported (chords, second staff, repeats, unreadable measures) in `warnings`.
- Parse the tool input with zod. On failure, return a `BAD_REQUEST` error with the zod message. Append `validateMelody` warnings to the model's warnings.
- Set `sourceFileName` and `extractionModel` on the result.

### 5. Playback hook

Create `src/hooks/useMelodyPlayer.ts`:
- Lazily create the `Tone.Sampler` on first play (browsers require a user gesture before `Tone.start()`). Wait for samples to load before starting.
- Schedule notes on `Tone.Transport` from `noteStartBeats`, using `tempoBpm × tempoScale` as the BPM. Merge tied notes into one attack. Rests schedule nothing. Release each note at 90% of its duration so repeated pitches are audible as separate notes.
- API: `{ play(fromNoteIndex?), pause(), stop(), isPlaying, currentNoteIndex, tempoScale, setTempoScale, octaveShift, setOctaveShift, loop, setLoop(range | null), isLoading }`. `loop` is a note-index range; Transport loops over its beat range.
- `currentNoteIndex` updates via `Tone.Draw` so the UI highlight stays in sync with sound.
- Stop the Transport and dispose the sampler on unmount.
- `renderWav(melody, tempoScale, octaveShift): Promise<Blob>` using `Tone.Offline` with the same scheduling. Encode 16-bit PCM WAV in a small local helper. `file-saver` is already a dependency; use it for the download.

### 6. Melody tab UI

Add a `melody` tab to `src/components/AppContent.tsx` labelled "Melody", after the existing tabs.

Create `src/components/Melody/`:

- `MelodyWorkspace.tsx`: the tab content. Left/top: list of saved melodies (`melody.list`) with a "New from PDF" button. Main area: the selected melody in the player, or the import flow. Signed-out users see a sign-in prompt.
- `MelodyImport.tsx`: `FileDropZone` with `acceptedTypes={["application/pdf", ".pdf"]}`, client-side size check (3 MB), read as base64, call `extractFromPdf`, show a loading state ("Reading the music…"), then hand the result to the review editor.
- `MelodyReview.tsx`: editable review before save and for later edits.
  - Header fields: title, tempo (BPM), time signature, pickup beats.
  - Warnings list at the top, from the extraction plus live `validateMelody` results.
  - Notes grouped by measure, each measure a row of note cells. Each cell shows pitch (or "rest"), duration as a note name (quarter, eighth, dotted half …) and lyric. Clicking a cell opens inline editors for pitch (text, validated), duration (select of common values: 4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25), lyric, tie. Buttons to insert a note after, and delete.
  - A measure whose beats do not add up gets a visible warning style.
  - "Play" here uses the same player so the user can check by ear while correcting.
  - "Link to song" select: pick a project and a section. Populate from `api.scriptData.getAll` for the user's sources. Optional.
  - Save calls `melody.save`.
- `MelodyPlayer.tsx`: the practice view for a saved melody.
  - Play / pause / stop. Tempo control 50%–150% in 5% steps (match `src/components/ui/font-size-control.tsx`). Octave down / normal / up. Loop: select a start and end measure, toggle loop on.
  - Lyrics shown in `font-script`, flowing as text grouped by measure, the current syllable highlighted with the accent color, auto-scrolling to keep it in view. Clicking a syllable starts playback from that note.
  - "Edit" opens `MelodyReview`. "Download WAV" calls `renderWav`. "Delete" with a confirm step that is not a native `confirm()` dialog.

### 7. Fixture

- Install LilyPond locally (`brew install lilypond`) and engrave a public-domain melody with lyrics, recommended "Twinkle, Twinkle, Little Star" (first 8 measures, 4/4, C major, quarter = 100, with at least one half note and one dotted rhythm added if the tune has none, so rhythm reading is tested).
- Commit the `.ly` source and the rendered `.pdf` to `fixtures/melody/`, plus `fixtures/melody/expected.json` with the correct `MelodyNote[]` written by hand from the `.ly` file.
- Add `scripts/check-melody-extraction.ts` (run with `npx tsx`) that calls `extractMelody` on the fixture and prints a per-note diff against `expected.json` plus an accuracy percent (pitch match, beats match, lyric match, counted separately). This is a manual check, not a CI test.

## Verification

1. `npx tsx scripts/check-melody-extraction.ts` with `ANTHROPIC_API_KEY` set. Expected: pitch and beat accuracy at or near 100% on the fixture. Record the result in the PR description. If accuracy is poor, improve the prompt before building further UI.
2. `npm run dev`, sign in, open the Melody tab. Upload `fixtures/melody/twinkle.pdf`. Confirm the loading state, then the review screen with the right title, tempo, time signature, and all measures. Confirm no measure is flagged as wrong length.
3. Press Play in review. Hear a piano tone playing the tune in correct rhythm, with the lyric highlight following the sound.
4. Change one note's pitch and one duration in review. Confirm the measure length warning appears when beats no longer add up and clears when fixed. Save.
5. Reload the page. Confirm the melody is in the list and opens in the player with the edits kept.
6. In the player: set tempo to 50% and 150% and confirm the speed changes audibly; set octave up and down; set a loop over measures 3–4 and confirm it repeats only those; click a syllable in measure 5 and confirm playback starts there.
7. Download WAV. Confirm the file plays in a normal audio player at the chosen tempo.
8. Link the melody to a song section in a project, save, reload, and confirm the link persists.
9. Upload a non-PDF and a PDF over 3 MB. Confirm clear errors and no server call for the oversized file.
10. Unset `ANTHROPIC_API_KEY`, restart. Confirm the import shows "Melody import is not configured" and saved melodies still play.
11. Manual real-world check: upload one real vocal-line PDF from a show (do not commit it). Report in the PR what the extraction got right and wrong.
12. `npm run lint` passes.

## Open questions

- **Extraction accuracy on real show scores.** An LLM reading notation is good but not perfect on dense rhythms and ledger lines. Recommended: ship with the review editor as the safety net. If step 11 shows poor accuracy, note it in the PR and propose a dedicated optical music recognition service (e.g. Audiveris producing MusicXML) as a follow-up. Do not build that this round.
- **Scores with a piano reduction under the vocal line.** Recommended: tell the model to read only the top staff with lyrics and list the rest as a warning. Mention in the upload hint that a vocal-line-only PDF works best.
- **Next round, inline in the runner (for context only, do not build):** a `showMelodyForSongs` boolean in `src/lib/preferences.ts`; when on and the runner's current section is a song with a linked melody (matched on `link.projectName` + `link.sectionTitle`), show a compact `MelodyPlayer` above the script.
