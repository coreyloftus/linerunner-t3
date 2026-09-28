# Continuous script: scenes as bookmarks, section dividers

## Instructions to the executing agent

Read this entire document before writing any code.

Work autonomously. Make reasonable decisions without checking in. Items marked **recommended** may be overridden with good reason. Items marked **locked** may not.

Finish by creating a fresh branch off `main`, committing with conventional commits, and opening a PR against `main`. This repo has no `dev` branch. Remote HEAD is `origin/main`. Do not commit to `main` directly. Do not force-push.

Suggested branch: `feat/continuous-script`.

There is no project test suite. Proof is the Verification section: run the app and play through a section boundary. `npm run lint` must pass before the PR.

## Goal

Today a project already holds many scenes, but the runner and the viewer only ever load one scene. Playback stops at the last line of that scene. When this work is done, a project plays as one continuous script. Picking a scene becomes a bookmark: playback starts at that scene's first line and keeps going into the next scene or song. Every section boundary shows a clear horizontal divider that names the next section and says whether it is a scene or a song. A whole show can be pasted into Add Script in one pass, with markers that split it into sections.

## Context & Constraints

Stack: Next.js 16 App Router, React 19, tRPC 11, Tailwind, Radix. Global state is React context in `src/app/context.tsx`. **Locked:** do not add a state library.

UI follows the "Prompt Book" design system: token classes (`bg-surface`, `text-muted-foreground`, `bg-accent`, `border-border`), `font-display` / `font-script`, small-caps letterspaced labels for section headers. Tokens live in `src/styles/globals.css`. Do not add new colors or fonts, and do not use raw `stone-*` classes.

### What exists

- Data types: `ProjectJSON`, `SceneJSON`, `LineJSON` in `src/server/scriptService.ts`. A project is `{ project, scenes: SceneJSON[], characters? }`. A scene is `{ title, lines }`. A line is `{ characters: string[], line, sung? }`.
- `ScriptService.normalizeProject` normalizes every project on read (local files, public, shared, user Firestore). Add new optional fields there so every source gets them.
- Scene order in `scenes[]` is show order. Do not sort sections by title.
- Runner: `src/components/ScriptDisplay/ScriptBox.tsx`. It resolves one scene with `...scenes.find((scene) => scene.title === selectedScene)` and indexes `script.lines` with `currentLineIndex` from context. Arrow navigation, `proceedWithScene`, the `isLastLine` flag, and `useAutoAdvance` (`src/hooks/useAutoAdvance.ts`, `src/lib/auto-advance.ts`) all read `script.lines`.
- Line rendering: `src/components/ScriptDisplay/CharacterLineDisplay.tsx` takes `script: { lines }` and `currentLineIndex`.
- Viewer: `src/components/ScriptViewer.tsx` renders one scene, found the same way.
- Scene picker: `src/components/NewScriptSelect.tsx` (`setSelectedScene`). Workspace: `src/components/ScriptsWorkspace.tsx`.
- Editor: `src/components/ScriptData.tsx` edits one scene at a time and saves through `scriptData.updateScript` (`src/server/api/routers/scriptData.ts`, input has `scenes: z.array(...)`).
- Add Script: `src/components/AddScriptDoc.tsx`. It takes a project name, one scene title, and pasted text. `parseScript(script, characterNames)` turns the text into lines and marks all-caps lyrics as `sung`. It saves through `scriptData.createScript` / `createAdminScript` (input has one `sceneTitle`).
- Local sample data: `public/sceneData/*.json`. `next-to-normal.json` has many song sections and is the best manual test file.

### Locked decisions

| Topic | Decision |
|---|---|
| Section kind | Add optional `kind?: "scene" \| "song"` to `SceneJSON`. No other new section fields. |
| Kind when missing | `normalizeProject` infers it: `"song"` when at least half the section's lines are `sung`, else `"scene"`. An explicit `kind` always wins. Always emit `kind` after normalization. |
| Stored data | No migration. Old documents without `kind` keep working through inference. Only write `kind` when a user saves a section. |
| Line index | `currentLineIndex` becomes an index into the whole project's flattened line list, not into one scene. |
| Bookmark | `selectedScene` is only the start point. Selecting a section sets `currentLineIndex` to that section's first line. Playing past a section's last line continues into the next section. Playback ends at the project's last line. |
| `selectedScene` while playing | Do not change `selectedScene` as playback crosses into a new section. The current section is derived from `currentLineIndex`. |
| Divider | One divider at every section boundary, including scene→scene and song→song. It names the incoming section and its kind. |
| Stage directions | Out of scope. Do not add a stage direction line type or field. |

### Do not touch

- Speech match logic in `src/hooks/useSpeechMatch.ts`, beyond passing it the flattened line.
- Theme handling and the inline script in `src/app/layout.tsx`.
- Sharing / copy procedures in `scriptData.ts` (`shareExistingProject`, `syncSharedProject`, etc.). They copy `scenes` wholesale, so `kind` rides along.
- `src/server/api/routers/voice.ts`.
- Do not commit new libretto text to `public/sceneData/`. Source scripts stay out of the repo.

## Non-Goals

- Stage directions.
- Pausing automatically at section boundaries, or any new playback preference.
- Merging separate projects into one.
- Reordering sections (the existing editor does not do this and this round does not add it).
- Changing how `parseScript` detects speakers or sung lines.

## Implementation Plan

### 1. Schema and normalization

`src/server/scriptService.ts`:
- Add `export type SectionKind = "scene" | "song";` and `kind?: SectionKind` on `SceneJSON` and `RawScene` (`kind?: unknown` on the raw type).
- In `normalizeProject`, keep a valid `kind` and otherwise infer it per the locked rule. Put the inference in a small exported helper `inferSectionKind(lines: LineJSON[]): SectionKind`.

`src/server/api/routers/scriptData.ts`:
- Add `kind: z.enum(["scene", "song"]).optional()` to every zod scene schema that accepts scenes (`updateScript` and any other).
- The `ProjectJSON` type re-exported from this router must carry `kind`. Keep one source of truth.

### 2. Flattened script stream

Create `src/lib/script-stream.ts`:

```ts
export interface StreamSection {
  title: string;
  kind: SectionKind;
  startIndex: number; // first line, in the flattened list
  endIndex: number;   // last line, inclusive
}
export interface StreamLine extends LineJSON {
  sectionIndex: number;
}
export function flattenProject(project: ProjectJSON | undefined): {
  lines: StreamLine[];
  sections: StreamSection[];
};
export function sectionAt(sections: StreamSection[], lineIndex: number): number;
```

Skip sections with zero lines in `lines`, but keep them out of `sections` too so every section has a real start line. Memoize the result in callers with `useMemo` keyed on the project object.

### 3. Runner plays the whole project

`src/components/ScriptDisplay/ScriptBox.tsx`:
- Resolve the selected project, then `const { lines, sections } = flattenProject(project)`. Replace every `script.lines` / `script?.lines` read with `lines`.
- When `selectedScene` or the selected project changes, set `currentLineIndex` to the matching section's `startIndex` and reset word state the same way the existing reset effect does. Find the current reset path (it may live in `NewScriptSelect.tsx` or `context.tsx`) and replace its hard `0` with the section start.
- Keep a local `bookmarkStart` (the `startIndex` of the selected section). Render from `Math.min(bookmarkStart, currentLineIndex)`, so earlier sections stay hidden unless the user arrows back into them.
- Arrow up may cross back into the previous section. Arrow down and auto-advance cross forward. `isLastLine` means the last line of the project.
- `useAutoAdvance` and speech match receive the flattened `lines`. They should need no logic change. Confirm by reading them.
- Show the current section in the runner header or `src/components/ControlBar.tsx`: small-caps kind label plus title, derived from `sectionAt(sections, currentLineIndex)`. Recommended format: `SONG · My Psychopharmacologist and I`.

### 4. Dividers

Create `src/components/ScriptDisplay/SectionDivider.tsx`: a full-width hairline (`border-t border-border`) with a centered label on the surface background. Label: small-caps kind (`SCENE` / `SONG`), a separator, the title in `font-display`. Songs use the accent color for the kind label and a music-note icon from `react-icons`. Scenes use `text-muted-foreground`. Add `role="separator"` and an `aria-label` like `Song: My Psychopharmacologist and I`.

`src/components/ScriptDisplay/CharacterLineDisplay.tsx`:
- Accept `lines: StreamLine[]`, `sections: StreamSection[]`, and `renderStart: number` in place of `script`.
- Before any rendered line whose index is a section `startIndex`, render `SectionDivider` for that section. This includes the first rendered section, so the actor always sees where they are.

### 5. Viewer shows the whole project

`src/components/ScriptViewer.tsx`:
- Render every section in order, each preceded by `SectionDivider`.
- When `selectedScene` changes, scroll the matching divider into view (`scrollIntoView({ block: "start" })`). Give each divider an `id` from the section index.
- Keep the existing per-line highlighting behavior.

### 6. Picker labels

`src/components/NewScriptSelect.tsx`:
- Label the scene select "Start at". Keep show order. Prefix each option with its kind (music-note icon for songs, or a small `SONG` / `SCENE` tag). No other behavior change.

### 7. Edit a section's kind

`src/components/ScriptData.tsx`:
- Add a Scene / Song toggle next to the Scene Title field. Initialize from the normalized `kind`. Include `kind` in the scene object sent to `updateScript`.

### 8. Paste a whole show

`src/components/AddScriptDoc.tsx`:
- Before `parseScript` runs, split the pasted text on marker lines matching `/^\s*(SCENE|SONG)\s*:\s*(.+?)\s*$/i`. Each marker starts a new section with that kind and title. Marker lines are removed and never reach `parseScript`.
- Text before the first marker belongs to a section titled with the existing Scene Title field (kind inferred). If there are no markers, behavior is unchanged.
- Show a small preview under the textarea: section count and each section's kind + title + line count.
- Add a hint under the textarea documenting the marker syntax, e.g. `SONG: Just Another Day`.

`src/server/api/routers/scriptData.ts` and the Firestore layer (`src/server/firebase.ts`, `src/server/scriptService.ts`):
- Extend `createScript` and `createAdminScript` with an optional `scenes: SceneJSON[]` input. When present, append all sections to the project in order in one write. Keep the existing single `sceneTitle` + `lines` path working. If a section title already exists in the project, fail with a clear error rather than overwriting (**recommended**; follow whatever the single-scene path does today if it already handles duplicates).

## Verification

Run `npm run dev` and open the app.

1. **Continuous play.** Local source, project "Next to Normal". Pick a character. In "Start at", pick a section in the middle. Press play. Confirm the first rendered line is that section's first line, with a divider above it naming the section. Advance (arrow down, or let auto-advance run) past the section's last line. Confirm a divider appears naming the next section and playback continues without stopping. The header label changes to the new section. `selectedScene` in the picker does not change.
2. **Divider kinds.** Find a song→scene boundary and a scene→song boundary (or two songs in a row). Confirm each boundary shows exactly one divider, songs use the accent label with the note icon, and scenes use the muted label.
3. **Arrow back.** At the first line of a section reached by continuing, arrow up. Confirm it returns to the previous section's last line and that section's lines render.
4. **End of project.** Pick the last section, play to the end. Confirm playback stops at the project's last line and nothing throws in the console.
5. **Bookmark change mid-play.** While playing, pick a different section. Confirm the runner jumps to that section's first line with word state reset.
6. **Viewer.** Open Line Viewer. Confirm all sections render in order with dividers, and changing "Start at" scrolls to that divider.
7. **Kind inference and override.** Open Script Data on a section with mostly sung lines. Confirm the toggle shows Song. Switch it to Scene, save, reload. Confirm the divider now shows SCENE. (Needs sign-in and a user or admin project.)
8. **Whole-show paste.** Signed in, open Add Script. Paste a short made-up script with three markers (`SCENE: Opening`, `SONG: First Song`, `SCENE: After`) and a few lines under each. Confirm the preview shows three sections with the right kinds. Save. Pick the new project and play from "Opening". Confirm it runs through all three sections with dividers. Do not commit this text.
9. **Legacy data.** Confirm every file in `public/sceneData/` still loads and plays, including the ones stored as arrays of projects.
10. `npm run lint` passes.

## Open questions

- **Should the runner pause at a section boundary?** Recommended: no. Continuous play is the point of this feature. A pause preference can come later.
- **Songs whose lines are not all-caps in the source (so no `sung` flags).** Recommended: accept that inference labels them as scenes. The user fixes it with the Script Data toggle or a `SONG:` marker.
