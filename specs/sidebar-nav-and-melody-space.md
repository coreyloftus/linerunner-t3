# Sidebar navigation, full-height workspaces, and a larger Melody view

## Instructions to the executing agent

Read this entire document before writing any code.

Work autonomously. Make reasonable decisions without checking in. Items marked **recommended** may be overridden with good reason. Items marked **locked** may not. Do not relitigate locked items.

Finish by creating a fresh branch off `main`, committing with conventional commits, and opening one PR against `main`. This repo has no `dev` branch. Remote HEAD is `origin/main`. Do not commit to `main` directly. Do not force-push. Commit subjects are one line. Do not add `Co-Authored-By` trailers.

Suggested branch: `feat/sidebar-nav-melody-space`.

There is no project test suite. Proof is the Verification section: run the app, measure the line area before and after, and exercise every mode on desktop and phone widths. `npm run lint` and `npm run build` must pass before the PR.

This work is split into streams so a lead agent and subagents can run in parallel. See **Work split** at the end of Implementation Plan. Follow the file ownership there so two agents never edit the same file.

## Goal

Today the app loses a lot of height to chrome. A tab bar (menu button, Line Runner, Line Viewer, Scripts, Melody) sits above every workspace, and each workspace is a floating card sized `90dvh × 95dvw`, with the runner's control bar fixed at 10% of that card. When this work is done, the tab bar is gone. The four app modes live at the top of the sidebar, above a separate, grouped settings area. On desktop the sidebar is a persistent column that can collapse to a thin icon rail. On phones it is a drawer opened from one small floating button. Every workspace fills all the remaining height and width, so the runner shows more lines. The Melody mode drops its fixed saved-melody column and its tall settings card, fills the full width, and lets the user pick Score, Lyrics, or Both, with a staff zoom, so they see much more of the score or the lyrics. The melody view is built as a self-sizing panel so a later round can place it inside a scene.

## Context & Constraints

Stack: Next.js 16 App Router, React 19, tRPC 11, Tailwind 3, Radix primitives, `react-icons`. Global state is React context in `src/app/context.tsx`. **Locked:** do not add a state library or a new UI dependency (no new Radix packages, no accordion or popover library).

UI follows the "Prompt Book" design system. Use token classes (`bg-surface`, `bg-surface-raised`, `text-muted-foreground`, `bg-accent`, `bg-accent-soft`, `border-border`, `text-curtain`), `font-display` / `font-script`, and small-caps letterspaced labels for section headers (`text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground`). Tokens live in `src/styles/globals.css`. Do not add colors or fonts. Do not add raw `stone-*` classes. Replace `stone-*` classes in any file you already edit.

Custom breakpoints in `tailwind.config.ts`: `xs` 375px, `iphone` 393px, `md` 768px, `ipad` 834px. Safe-area utilities `pt-safe-top` / `pb-safe-bottom` already exist.

### What exists

- `src/app/page.tsx` — server component. Fetches public data and renders `<ScriptProvider><AppContent/></ScriptProvider>`.
- `src/components/AppContent.tsx` — client shell. Holds `sidebarOpen` and `activeTab` in `useState`. Renders `SidebarClient` in a fixed wrapper, then a Radix `Tabs` with a 5-column `TabsList` (the `SidebarToggle` button plus four `TabsTrigger`s with emoji / short / long labels) and four `TabsContent`: `runner` → `ScriptBox`, `viewer` → `ScriptViewer`, `scripts` → `ScriptsWorkspace` (its `onPractice` switches to `runner`), `melody` → `MelodyWorkspace`.
- `src/components/SidebarClient.tsx` — overlay drawer on every screen size (`w-[85vw]` … `md:w-[33vw]`, slides in with `translate-x`). It has a backdrop on mobile, closes on Escape and on outside click (ignoring Radix popper content), and holds, top to bottom: wordmark + `AuthButton`; "Script Select" (`NewScriptSelect`); "Settings" (Theme, Speech Match, `PlaybackSettings`, disabled Scene Partner Voice, admin Refresh Data); "Display" (`DisplaySettings`); admin "Project Sharing" (`AdminSharingPanel`); a fixed footer credit link.
- `src/components/SidebarToggle.tsx` — hamburger button, only used by `AppContent`. Uses `stone-*` classes.
- Workspaces all use the same outer frame: `flex h-[90dvh] w-[95dvw] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl …`. Files: `src/components/ScriptDisplay/ScriptBox.tsx` (line ~403), `src/components/ScriptViewer.tsx` (~154), `src/components/ScriptsWorkspace.tsx` (~133), `src/components/Melody/MelodyWorkspace.tsx` (~58).
- `ScriptBox` splits its card into `h-[90%]` (line list `<ul>` that scrolls to the current line via `scrollRef.scrollIntoView({ block: "end" })`) and `h-[10%]` (`ControlBar`). It registers a `window` `keydown` handler for Space and arrows while mounted.
- `src/components/ControlBar.tsx` — play/pause, stop, line up/down, word left/right, `h-full`.
- Melody:
  - `src/components/Melody/MelodyWorkspace.tsx` — header (title + "New from PDF" / "Import JSON", signed-in only), then a row with a saved-melody `<aside>` (`max-h-40` on mobile, `md:w-60` column on desktop) and a `<main>` that shows empty / `MelodyImport` / `MelodyReview` / `MelodyPlayer`. Signed-out users see a sign-in prompt.
  - `src/components/Melody/MelodyPlayer.tsx` — `mx-auto max-w-3xl` column: title + Edit / Download WAV / Delete; a wrapping "transport + settings" card (Play/Pause, Stop, Tempo stepper, Octave segmented control, Loop measures selects + toggle); staff box (`max-h-[65vh] … md:max-h-[50%]`); lyrics box (`max-h-[40vh] … md:flex-1`, `font-script text-lg`, one row per measure, click a syllable to play from it, loop rows tinted, current syllable highlighted and kept in view with `scrollWithinParent`).
  - `src/components/Melody/MelodyStaff.tsx` — VexFlow SVG renderer. Width comes from a `ResizeObserver`. Scale is hard-coded: `const scale = containerWidth < 640 ? 0.75 : 1;` in `renderStaff`. Current-note highlight is a class toggle, never a re-render.
  - `src/components/Melody/MelodyReview.tsx`, `MelodyImport.tsx` — review editor and PDF upload. Out of scope except where they sit inside the new frame.
  - `src/lib/melody.ts` — `Melody` type. `Melody.link = { projectName, source, sectionTitle }` ties a melody to a script section.
- Preferences: `src/lib/preferences.ts` holds one `UserPreferences` document (`version: 1`, `display`, `speechMatchEnabled`, `playback`) in localStorage key `linerunner-preferences`. `normalize()` fills defaults for missing or bad fields, so new optional groups need no version bump. `src/app/context.tsx` hydrates it after mount into separate state values (`displayPreferences`, `playbackPreferences`, `speechMatchEnabled`) and saves the whole document in one effect.
- Unused files: `src/components/Navbar.tsx`, `src/components/Titlebar.tsx`, `src/components/Sidebar.tsx`, `src/components/ScriptDisplay.tsx` are not imported anywhere.
- Sample data: `public/sceneData/*.json` (local source). Melody fixture: `fixtures/melody/expected.json` (importable through "Import JSON" after sign-in; Twinkle Twinkle, 8 measures).
- Related spec, not yet built: `specs/continuous-script.md` makes a project play as one stream of sections with `kind: "scene" | "song"`. The future melody-in-scene work builds on it. Do not build any of it here.

### Locked decisions

| Topic | Decision |
|---|---|
| Top tab bar | Remove it entirely. No mode switcher remains above any workspace. |
| Mode navigation | The four modes are the first group in the sidebar, above everything else. Labels: **Line Runner**, **Line Viewer**, **Scripts**, **Melody**. Icons from `react-icons` (no emoji). The active mode has `aria-current="page"` and the accent style. |
| Mode state | `type AppMode = "runner" \| "viewer" \| "scripts" \| "melody"`, held in `useState` in the shell, default `"runner"`. No URL routing, no persistence of the mode. Workspaces render by a plain conditional (only the active one is mounted, same as Radix `TabsContent` today). Drop Radix `Tabs` from the shell; leave `src/components/ui/tabs.tsx` in place. |
| Sidebar groups | Three groups, in order: **Mode** (nav), **Script** (`NewScriptSelect`), **Settings**. Settings is split into collapsible sub-groups: **Playback**, **Display**, **Admin** (admin only). Each sub-group is a native `<details>`/`<summary>` or a button + conditional block. No new dependency. |
| Desktop (`md` and up) | Sidebar is a persistent column in normal document flow. Content sits beside it, never under it. Two states: expanded (`w-72`) and collapsed icon rail (`w-14`). No backdrop, no outside-click close. |
| Phone (below `md`) | Sidebar is an overlay drawer, as today: backdrop, Escape closes, outside click closes. Picking a mode closes the drawer. The drawer opens from one floating menu button. There is no header bar and no bottom tab bar. |
| Collapsed state | Persist `sidebarCollapsed` in the preferences document (desktop only; phones ignore it). |
| Workspace frame | Every workspace fills its parent: `h-full w-full`. No `dvh`/`dvw`/`vh`/`vw` units inside any workspace component. Only the shell sizes itself to the viewport. |
| Melody view mode | `melody.view: "score" \| "lyrics" \| "both"` in the preferences document. Default `"both"`. |
| Melody staff zoom | `melody.staffScale` in the preferences document, a number from `0.5` to `1.5`, step `0.1`, default `1`. It replaces the hard-coded `0.75 / 1` in `MelodyStaff`. |
| Reusable melody panel | The staff + lyrics area becomes its own component, `MelodyPanel`, that sizes to its parent and takes playback state as props. It must work when placed inside any container. Do not read viewport size in it. |

### Do not touch

- Playback logic in `ScriptBox` (navigation, auto-advance, speech match, keyboard handler behavior). Only change its layout classes and the `ControlBar` height.
- `src/hooks/useSpeechMatch.ts`, `src/hooks/useAutoAdvance.ts`, `src/lib/auto-advance.ts`, `src/hooks/useMelodyPlayer.ts`.
- Melody extraction, the `melody` tRPC router, `MelodyImport` and `MelodyReview` internals.
- Theme handling and the inline script in `src/app/layout.tsx`.
- `src/server/**`. This is a client-only change.
- Data shapes (`ProjectJSON`, `SceneJSON`, `Melody`).
- `public/sceneData/`. Do not commit new script files.

## Non-Goals

- Melody inside the runner or viewer. Only prepare `MelodyPanel` for it (see step 6).
- The continuous-script work in `specs/continuous-script.md`.
- URL routes or deep links per mode.
- Auto-hiding the sidebar or control bar while a scene plays.
- A redesign of `ScriptsWorkspace`, `ScriptData`, `AddScriptDoc`, `NewScriptSelect`, or `AdminSharingPanel` internals. They move into the new frame and keep working.
- New settings. Every existing setting moves to its new group unchanged.

## Implementation Plan

### 1. Preferences: layout and melody groups (foundation, do first)

- `src/lib/preferences.ts`:
  - Add `export interface LayoutPreferences { sidebarCollapsed: boolean }`, default `{ sidebarCollapsed: false }`.
  - Add `export type MelodyView = "score" | "lyrics" | "both"` and `export interface MelodyPreferences { view: MelodyView; staffScale: number }`, default `{ view: "both", staffScale: 1 }`.
  - Add `layout` and `melody` to `UserPreferences`. Keep `version: 1`.
  - Add `normalizeLayout` and `normalizeMelody` next to the existing normalizers. `staffScale`: finite number clamped to `[0.5, 1.5]` and rounded to one decimal. Do not reuse `clamp()` as-is, because it rounds to an integer. Unknown `view` → `"both"`.
  - `defaultPreferences()` and `migrateLegacy()` include the new groups.
- `src/app/context.tsx`: add `layoutPreferences` / `setLayoutPreferences` and `melodyPreferences` / `setMelodyPreferences` exactly like `playbackPreferences`: state, hydration in the load effect, inclusion in the save effect and its dependency list, context type, default context value, and provider value.

The app must build and behave the same after this step.

### 2. App shell

- Rename `src/components/AppContent.tsx` to `src/components/AppShell.tsx` and export `AppShell`. Update `src/app/page.tsx`. (**Recommended** rename. Keeping the old name is fine if it makes the diff clearer.)
- Add `src/lib/app-mode.ts` with `AppMode`, and an ordered `APP_MODES` array of `{ id, label, icon }` for the nav. Icons (**recommended**): Line Runner `FaPlay`, Line Viewer `FaBookOpen`, Scripts `FaLayerGroup`, Melody `FaMusic` (all from `react-icons/fa6`).
- Shell layout:

```
md and up                                  below md
┌──────────┬──────────────────────────┐    ┌──────────────────────────┐
│ Sidebar  │                          │    │[≡]                       │ ← floating button,
│ w-72     │  active workspace        │    │                          │   overlays content
│  or w-14 │  fills this area         │    │  active workspace        │
│ (rail)   │  (h-full w-full)         │    │  edge to edge            │
│          │                          │    │                          │
└──────────┴──────────────────────────┘    └──────────────────────────┘
```

  - Root: `flex h-[100dvh] w-full overflow-hidden supports-[height:100svh]:h-[100svh]` with safe-area padding.
  - Main: `relative flex min-w-0 min-h-0 flex-1`. On `md` and up, give the workspace a small inset page look: `md:p-2` and a wrapper with `md:rounded-2xl md:border md:border-border md:shadow-xl md:shadow-black/5 dark:md:shadow-black/40 overflow-hidden`. Below `md`: no padding, border, radius, or shadow. (**Recommended** look; the locked part is that workspaces get `h-full w-full`.)
  - Render the active workspace with a conditional. `ScriptsWorkspace` keeps `onPractice={() => setMode("runner")}`.
  - Phone menu button: new `src/components/MobileMenuButton.tsx` (replaces `SidebarToggle`). `md:hidden`, `absolute` top-left inside main, respects `pt-safe-top`, 40×40, `rounded-full bg-surface-raised/80 backdrop-blur-sm border border-border`, `aria-label="Open menu"`. It overlays content. The runner line list scrolls the current line to the bottom, so the button covers only old lines. Workspaces that have their own header row add `pl-12 md:pl-3` (or similar) to that row so the button never covers header controls.
  - Keyboard shortcut (**recommended**): `\` toggles the sidebar (collapse on desktop, open/close drawer on phone). Ignore it when focus is in an `input`, `textarea`, `select`, or `contenteditable`. It must not collide with the `ScriptBox` handler (Space and arrows only).
- Delete `src/components/SidebarToggle.tsx`, `src/components/Navbar.tsx`, `src/components/Titlebar.tsx`, `src/components/Sidebar.tsx`, `src/components/ScriptDisplay.tsx` after confirming with `grep -rn` that nothing imports them.

### 3. Sidebar restructure

Rewrite `src/components/SidebarClient.tsx`. Props become `{ projects, allData, mode, onModeChange, collapsed, onCollapsedChange, mobileOpen, onMobileOpenChange }`.

Expanded content, top to bottom:

```
LineRunner (wordmark)          [auth]  [«]   ← « collapses (md+ only); × closes (phone only)
MODE
  ▶  Line Runner        ← active: bg-accent-soft, accent text, left accent bar
  📖 Line Viewer
  ▦  Scripts
  ♪  Melody
─────────────
SCRIPT
  <NewScriptSelect/>
─────────────
SETTINGS
  ▸ Playback   Auto-advance + steppers (PlaybackSettings), Speech Match, Scene Partner Voice (disabled)
  ▸ Display    Theme, colors + font size (DisplaySettings)
  ▸ Admin      Refresh Data, Project Sharing          (isAdmin only)
─────────────
footer credit (in normal flow at the end of the scroll area, not position: fixed)
```

- Mode items are `<button>`s, full width, min height 40px (44px below `md`), icon + label. `aria-current="page"` on the active one.
- Settings sub-groups start closed (**recommended**). Their summary rows use the small-caps label style with a chevron that rotates when open.
- Collapsed rail (`md` and up only): wordmark shrinks to an "LR" monogram or the `FaPlay` accent mark; the four mode icons stay as buttons with `title` and `aria-label`; below them a settings (`FaSliders`) button and an expand (`»`) button. Clicking settings or expand sets `collapsed: false`. Script select and settings are not shown in the rail.
- Width transition: `transition-[width] duration-200`. Content must not reflow jankily while the width animates: hide labels with `sr-only` or `hidden` when collapsed rather than letting them wrap.
- Phone drawer: keep the current backdrop, Escape, and outside-click behavior (including the Radix popper exemptions, which `NewScriptSelect` needs). Drawer width `w-[85vw] max-w-sm`. Picking a mode calls `onModeChange` and closes the drawer.
- Desktop: no backdrop and no outside-click close. Escape does nothing on desktop.
- The sidebar scroll area is `overflow-y-auto` with `min-h-0` so long settings scroll inside the sidebar, not the page.
- Replace `stone-*` classes in `src/components/PlaybackSettings.tsx` (its `Stepper`) with token classes while moving it.

### 4. Workspaces fill the frame

Change only the outer frame and height math. Do not change behavior.

- `src/components/ScriptDisplay/ScriptBox.tsx`: outer div → `flex h-full w-full flex-col overflow-hidden bg-surface`. Replace the `h-[90%]` block with `flex min-h-0 flex-1 flex-col`, and the `h-[10%]` wrapper with a fixed-height wrapper `h-14 flex-shrink-0 pb-safe-bottom` (56px, the `touch-lg` size). The empty-state text "Open the menu, pick a scene…" stays accurate.
- `src/components/ControlBar.tsx`: keep `h-full`; confirm the buttons fit 56px. No logic change.
- `src/components/ScriptViewer.tsx`, `src/components/ScriptsWorkspace.tsx`: same outer frame change. Add the phone left padding to any header row (step 2).
- `src/components/Melody/MelodyWorkspace.tsx`: its frame is changed in step 5 by the Melody stream.

After this step, on a 390×844 viewport the runner line list must be at least 88% of the viewport height (today about 81%). On 1440×900 it must be at least 90% of the viewport height.

### 5. Melody workspace: more room

- `src/components/Melody/MelodyWorkspace.tsx`:
  - Outer frame → `flex h-full w-full flex-col overflow-hidden bg-surface`.
  - Remove the saved-melody `<aside>`. Move the list into the header as a native `<select aria-label="Saved melodies">` (placeholder "Open a melody…") next to "New from PDF" and "Import JSON". On phones, the two action buttons become icon-only with `aria-label`s. Header gets the phone left padding.
  - The empty state (nothing selected) shows the saved list as large buttons in the main area, so a first-time user still sees it without the select.
  - `<main>`: remove padding when the player is showing (the player manages its own spacing); keep `p-3` for empty, import, and review views. Keep `overflow-y-auto` for import/review; the player view is `overflow-hidden` because its panels scroll internally.
- `src/components/Melody/MelodyPlayer.tsx`:
  - Remove `mx-auto max-w-3xl`. The player is `flex h-full min-h-0 flex-col`.
  - One compact toolbar row (`flex flex-wrap items-center gap-2 border-b border-border px-3 py-2`):
    - Left: title (`font-display`, truncate) with the meta line (`♩ = …`, time, key, link) as a `title` tooltip on desktop and hidden on phones.
    - Transport: Play/Pause, Stop (icon-only on phones).
    - Tempo stepper (compact: `−  85%  +`).
    - View segmented control: **Score · Lyrics · Both**, bound to `melodyPreferences.view`.
    - Zoom stepper `−  100%  +`, bound to `melodyPreferences.staffScale`, disabled when view is `"lyrics"`.
    - A "More" toggle button (`FaSliders`) that reveals a second row with Octave, Loop measures, Edit, Download WAV, Delete (with the existing confirm step). Hidden by default. Keep all existing behavior of these controls.
  - Below the toolbar, `<MelodyPanel …/>` fills the rest (`min-h-0 flex-1`). Keep `renderError` visible above the panel.
- New `src/components/Melody/MelodyPanel.tsx`:
  - Props: `{ melody: Melody; view: MelodyView; staffScale: number; currentNoteIndex: number; loop: { start: number; end: number } | null; onNoteClick: (index: number) => void; lyricFontSize?: number; className?: string }`.
  - `view === "score"`: staff box fills 100% height, scrolls vertically.
  - `view === "lyrics"`: lyrics box fills 100% height.
  - `view === "both"`: stacked, staff `flex-[3]` over lyrics `flex-[2]`, each `min-h-0 overflow-y-auto`. At `xl` and up, when the container is wide, side by side is allowed (**recommended**: keep stacked; the staff benefits more from width than height).
  - Move the lyrics markup (measure rows, clickable syllables, loop tint, current highlight, `scrollWithinParent` follow) out of `MelodyPlayer` into this component unchanged.
  - Lyrics font size follows `displayPreferences.fontSize` (percent of the current `text-lg` base) passed as `lyricFontSize`, so the script and lyrics grow together (**recommended**).
  - Boxes use the same border and background tokens as today but no outer margins, so the panel works inside any container.
- `src/components/Melody/MelodyStaff.tsx`:
  - Add prop `scale?: number` (default `1`). In `renderStaff`, replace `const scale = containerWidth < 640 ? 0.75 : 1;` with the prop value times `0.75` when `containerWidth < 640`, else times `1`. So phones keep today's default look at zoom 100%, and zoom scales from there.
  - Include `scale` in the render effect's dependency list so zoom redraws the SVG. The highlight effect must re-run after a redraw as it already does for `width`.
  - Lower zoom must fit more measures per system (the greedy wrap already uses `width = containerWidth / scale`).

### 6. Forward compatibility for melody inside a scene

Do not build the inline feature. Keep these properties so the next round can place `MelodyPanel` between script lines when the runner reaches a song section with a linked melody (`Melody.link.projectName` + `link.sectionTitle`):

- `MelodyPanel` and `MelodyStaff` contain no viewport units and no `fixed`/`absolute` positioning tied to the page.
- `MelodyPanel` has no data fetching and no player hook; playback state comes in through props.
- The view mode and zoom come from preferences, so an inline panel and the Melody mode share the same user choice.

Do not edit other specs.

### 7. Lint, build, clean-up

- `npm run lint` and `npm run build` pass.
- `grep -rn "h-\[90dvh\]\|w-\[95dvw\]\|h-\[90%\]\|h-\[10%\]" src` returns nothing.
- `grep -rn "TabsTrigger\|SidebarToggle" src` returns nothing outside `src/components/ui/tabs.tsx`.

### Work split

Step 1 is the foundation. The lead agent does it, commits it, and then starts the two streams in parallel from that commit. Each stream owns its files. Nobody edits a file owned by the other stream. The lead merges (rebase, not merge commits) and runs Verification.

| Stream | Owner | Steps | Files owned |
|---|---|---|---|
| Foundation | Lead | 1 | `src/lib/preferences.ts`, `src/app/context.tsx` |
| A: Shell + sidebar | Subagent A | 2, 3, 4 | `src/app/page.tsx`, `src/components/AppContent.tsx` → `AppShell.tsx`, `src/lib/app-mode.ts`, `src/components/MobileMenuButton.tsx`, `src/components/SidebarClient.tsx`, `src/components/PlaybackSettings.tsx`, `src/components/DisplaySettings.tsx`, `src/components/ScriptDisplay/ScriptBox.tsx`, `src/components/ControlBar.tsx`, `src/components/ScriptViewer.tsx`, `src/components/ScriptsWorkspace.tsx`, deleted files from step 2 |
| B: Melody | Subagent B | 5, 6 | `src/components/Melody/MelodyWorkspace.tsx`, `src/components/Melody/MelodyPlayer.tsx`, `src/components/Melody/MelodyPanel.tsx`, `src/components/Melody/MelodyStaff.tsx` |

Interface contract between streams:

- A renders `<MelodyWorkspace />` with no props inside a parent that has a definite height (`h-full` chain). B makes `MelodyWorkspace` fill it with `h-full w-full`.
- A's phone menu button is 40px at `left-2 top-2` (plus safe area). B's header row reserves `pl-12` below `md`.
- B reads `melodyPreferences` / `setMelodyPreferences` from `ScriptContext` (added in step 1). A reads `layoutPreferences` / `setLayoutPreferences`.

B does its browser checks after A lands, because `MelodyWorkspace` has no height of its own until the new shell exists. B can lint and build before that. Do not edit `AppContent.tsx` from stream B.

## Verification

Use the Playwright MCP tools or `agent-browser`. Run `npm run dev` from the repo root.

### Baseline (before any change)

On `main`, open `http://localhost:3000`, pick the local project from `public/sceneData/` (any scene, any character), press Space, and advance about ten lines. Record at 390×844 and at 1440×900:

- `document.querySelector("ul.overflow-y-auto").clientHeight` and `window.innerHeight`.
- A screenshot of the runner.
- The number of fully visible line rows (count `li` elements whose bounding box is inside the list box).

Save the numbers for the PR description.

### After

1. **Runner space.** Repeat the baseline at both sizes. Expected: list height ≥ 88% of viewport at 390×844 and ≥ 90% at 1440×900 (sidebar expanded), and more visible line rows than baseline at both sizes. With the sidebar collapsed at 1440×900, the list is wider by at least 200px. Put a before/after table in the PR.
2. **Navigation, desktop 1440×900.** No tab bar above the workspace. The sidebar shows Mode, Script, Settings in that order. Click each mode; the workspace changes and the item shows as active. Collapse to the rail; icons still switch modes; the rail's settings button re-expands. Reload; the collapsed state is kept.
3. **Navigation, phone 390×844.** Only the floating menu button shows over the workspace. Tap it; the drawer opens with a backdrop. Pick "Line Viewer"; the drawer closes and the viewer shows. Escape and a backdrop tap both close the drawer. Open the scene select inside the drawer; picking an option does not close the drawer.
4. **Settings still work.** In Playback, toggle auto-advance and change word speed; play a scene and confirm the effect. In Display, change theme and font size; confirm the runner updates. Reload; values persist (localStorage `linerunner-preferences` has `layout` and `melody` groups and the old groups unchanged).
5. **Scripts mode.** "Practice" from Scripts switches to Line Runner.
6. **Keyboard.** In the runner, Space and arrows behave as before. `\` toggles the sidebar and does nothing while typing in a text field.
7. **Melody (needs a signed-in session).** Sign in through the browser. If the agent cannot complete OAuth, ask Corey to sign in in the shared browser, then continue. Import `fixtures/melody/expected.json` through "Import JSON" if no melody exists, save it, and open it.
   - The player spans the full workspace width; no saved-melody column. The header select lists saved melodies and opens one.
   - Toggle Score / Lyrics / Both. Score fills the whole panel; Lyrics fills the whole panel; Both stacks them. Reload; the choice is kept.
   - Zoom to 50%: more measures fit on each staff line than at 100% (count `.vf-measure-number` y-positions or systems). Zoom to 150%: fewer. Zoom is disabled in Lyrics view.
   - Play: the current note highlight follows in the staff and the lyrics, and each panel keeps the current note in view. Click a syllable; playback starts there. "More" reveals Octave, Loop, Edit, Download WAV, Delete, and each still works.
   - Repeat at 390×844: the toolbar wraps without horizontal scroll; the menu button does not cover header controls.
8. **Other melody views.** "New from PDF" shows the import screen, and Edit shows the review editor, both scrollable inside the new frame.
9. **Themes.** Screenshots in light and dark at both sizes for the runner, the sidebar (expanded and rail), and the melody player. Attach them to the PR.
10. `npm run lint` and `npm run build` pass. The greps in step 7 return nothing.

## Open questions

- **Does the phone menu button hide a line the actor needs?** Recommended: no, because the runner keeps the current line at the bottom. If a screenshot shows the button over the current line on a short scene (few lines, list not yet scrolling), anchor the empty-state and short lists to the bottom (`justify-end`) rather than moving the button.
- **Default sidebar state on iPad portrait (768–1023px).** Recommended: honor the saved preference, default expanded. If the runner list is narrower than 480px there with the sidebar expanded, default to collapsed below `lg` when no preference is saved yet.
- **Octave and Loop behind "More".** Recommended: hidden by default to give the score the height. If Corey uses loop constantly, a follow-up can pin it to the main toolbar.
