# Authno — Feature Backlog

A living document. Paste this file into chat whenever you want to implement one of these features.

---

## 1. Find & Replace

**What it is**
An in-editor search bar (Ctrl+F) and optional replace panel (Ctrl+H) that highlights every match in the content-editable area and lets the author jump between them or replace one or all occurrences.

**Why it matters**
Completely absent right now. Any manuscript longer than a few pages becomes impossible to navigate or edit without it. It is a blocking gap for serious use.

**Implementation notes**
- Use `window.find()` or a custom mark/highlight pass over `editorRef.current.innerHTML`.
- Show a floating bar anchored below the EditorToolbar (same sticky positioning).
- Match count indicator: "3 of 12".
- Highlight colour should use `accentHex` with low opacity so the author can still read the text.
- Replace should work on the raw HTML string to avoid breaking formatting tags.

---

## 2. Typewriter Scroll

**What it is**
When enabled, the editor scrolls automatically after each keystroke so that the active line stays locked to the vertical centre of the visible writing area. The author's eyes never need to drift to the bottom of the screen.

**Why it matters**
Long-session writers strongly prefer this mode. It eliminates the eye-travel cost of hunting for the cursor after each sentence. Standard in dedicated writing apps like iA Writer and Ulysses.

**Implementation notes**
- Toggle lives in Settings → Writing Goal → Editor Behaviour.
- Uses `selectionchange` event + `range.getClientRects()[0]` to locate the cursor line.
- Calls `mainRef.current.scrollBy({ top: delta, behavior: "smooth" })` to recentre.
- A `Math.abs(delta) < 4` guard prevents jitter when already centred.
- When active, add `paddingBottom: "50vh"` to the editor div so the last lines of the document can also reach centre.
- **Already implemented** in `App.js` and `Settings.jsx`.

---

## 3. Insert Menu

**What it is**
The "Insert" button in EditorToolbar is currently a non-functional placeholder. It should open a small dropdown that lets the author insert structured content that plain text formatting cannot handle.

**Why it matters**
Authors regularly need horizontal rules between scenes, block quotes for epigraphs, code blocks for in-story text messages or terminal output, and images (chapter header art, maps, etc.).

**Implementation notes**
Items to include:
- **Horizontal rule** — `document.execCommand('insertHorizontalRule')` or inject `<hr>`.
- **Block quote** — `document.execCommand('formatBlock', false, 'blockquote')`, styled with a left accent border in CSS.
- **Code block** — wrap selection in `<pre><code>` tags, with monospace font.
- **Image** — open Electron's file dialog, read the file as a base64 data URL, inject `<img src="...">` into the content editable.
- The dropdown should use the same gradient style as BurgerMenu for visual consistency.

---

## 4. Heading Styles

**What it is**
Proper semantic heading formatting — H1, H2, H3 — accessible from the EditorToolbar. Currently the toolbar only supports bold, italic, underline, and highlight via `execCommand`, which cannot produce heading tags.

**Why it matters**
Authors use headings to mark chapter titles, section breaks, and scene headers inside the manuscript. Without them, long-form documents have no visual hierarchy.

**Implementation notes**
- Use `document.execCommand('formatBlock', false, 'H1')` (and H2, H3) — this is supported in contentEditable.
- Add three buttons to EditorToolbar: **H1**, **H2**, **H3**, with the same `FormatButton` component pattern.
- Style each heading level in `App.css` or via a `<style>` tag injected into the editor: `h1 { font-size: 2em; font-weight: 700; }` etc.
- The toolbar should detect the current block type (via `document.queryCommandValue('formatBlock')`) and highlight the active heading button.
- Keyboard shortcuts: Ctrl+1, Ctrl+2, Ctrl+3.

---

## 5. Keyboard Shortcuts Panel (Settings → Information)

**What it is**
A new "Information" or "Shortcuts" section inside the Settings panel that lists every keyboard shortcut the app supports, grouped by category.

**Why it matters**
Currently shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+H, Ctrl+S) exist only in code. New users have no way to discover them. A reference panel inside Settings is the natural place for this — it keeps the editor surface clean while making shortcuts discoverable.

**Implementation notes**
- Add a new nav item to `NAV_ITEMS` in `Settings.jsx`: `{ id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, group: 'App' }`.
- Render a clean two-column table: shortcut key on the left, description on the right.
- Group into sections: **Formatting**, **File**, **Navigation**.
- Full list to include:

| Shortcut | Action |
|---|---|
| Ctrl + B | Bold |
| Ctrl + I | Italic |
| Ctrl + U | Underline |
| Ctrl + H | Highlight |
| Ctrl + S | Save |
| Ctrl + F | Find |
| Ctrl + H | Replace |
| Ctrl + 1/2/3 | Heading H1/H2/H3 |
| Ctrl + Z | Undo |
| Ctrl + Y | Redo |

---

## 6. Chapter Division

**What it is**
The ability to split a single `.authbook` file into named, reorderable chapters. Each chapter is a separate content segment within the same file. The sidebar shows a book's chapters as an expandable tree beneath the book entry.

**Why it matters**
Right now one book = one undivided text blob. This is manageable for short stories but breaks down past ~5,000 words. Chapter-level navigation is the most fundamental structural feature a writing app needs.

**Implementation notes**
- Extend the `.authbook` JSON schema: add a `chapters` array alongside the top-level `content` field.
  ```json
  {
    "title": "My Novel",
    "chapters": [
      { "id": "ch1", "title": "Chapter 1", "content": "<p>...</p>", "order": 0 },
      { "id": "ch2", "title": "Chapter 2", "content": "<p>...</p>", "order": 1 }
    ]
  }
  ```
- The Sidebar renders each chapter as a nested item under its book, with a collapse/expand toggle.
- The Editor loads one chapter's `content` at a time; switching chapters saves the current one first.
- Chapter reordering uses the existing drag-drop logic from Sidebar.
- A "+" button beneath each book in the sidebar creates a new blank chapter.
- Word count per chapter is derived at render time from each chapter's content.
- **This feature is a prerequisite for Book Metadata and Writing Stats.**

---

## 7. Storyboard

**What it is**
A visual node-canvas tool — similar to Unreal Engine's Blueprint editor — where the author maps out their story using drag-and-drop blocks connected by directional arrows. Each block type represents a different story element.

**Why it matters**
The Storyboard button exists and already creates sessions with `type: 'storyboard'`, but clicking it opens the same plain text editor. The data model is ready; only the UI is missing.

**Block types**
- **Character block** — name, role (protagonist/antagonist/supporting), avatar colour.
- **Location block** — place name, description note, optional "interior/exterior" tag.
- **Action / Scene block** — a scene summary card with a title and a short note field.
- **Custom block** — free-label block for anything else (object, theme, faction, etc.).
- **Connector** — directional arrow between any two blocks, with an optional label ("causes", "leads to", "conflicts with").

**Implementation notes**
- Render on a `<canvas>` or absolutely-positioned `<div>` grid inside the main panel when `session.type === 'storyboard'`.
- Store node positions, types, and connections in the session's `content` field as JSON.
- Pan via middle-mouse drag or space+drag; zoom via scroll wheel.
- Double-click a blank area to create a new block; double-click a block to edit it inline.
- Character/World Notes (feature #9) live inside this canvas, accessible by expanding a Character or Location block.

---

## 8. Book Metadata

**What it is**
A per-book information panel where the author can view and edit metadata about their book: title, author name, genre, logline (one-sentence summary), word count target, cover image, and series name.

**Why it matters**
Once Chapter Division (feature #6) exists, the book-level entry in the sidebar becomes a container rather than a document. That container needs a home screen. Book Metadata is that home screen.

**Proposed placement**
Clicking the book entry in the sidebar (not a chapter) opens the Metadata panel in the editor area instead of loading text. It shares the same panel space as Writing Stats (feature #11) via two tabs: **Overview** and **Stats**.

**Fields**
| Field | Type | Notes |
|---|---|---|
| Title | text | Pre-filled from session title |
| Author | text | Defaults from Settings → Profile display name |
| Genre | dropdown | Fiction, Fantasy, Sci-Fi, Romance, Thriller, Non-fiction, Other |
| Logline | textarea | 1–2 sentence story summary |
| Cover image | file picker | Stored as base64 in the `.authbook` file |
| Word count target | number | Total manuscript target, separate from daily goal |
| Series | text | Optional series name and book number |

---

## 9. Character & World Notes

**What it is**
A structured notes system attached to each book (accessible via the Storyboard canvas) for storing character profiles, world-building details, and lore. Not part of the manuscript — a reference sidebar the author keeps open while writing.

**Proposed placement**
Lives inside the Storyboard (feature #7). Expanding a Character block or Location block reveals an inline notes panel. A dedicated "Notes" tab on the canvas toolbar opens a full notes browser.

**Character note fields**
- Full name, nickname, age, role.
- Physical description (free text).
- Personality notes.
- Arc summary.
- Relationships to other characters (links to other Character blocks).

**World / Location note fields**
- Place name, region, climate.
- Key description.
- Characters associated with this location.
- Historical notes.

**Implementation notes**
- Store notes as JSON inside each Character/Location block's data object in the Storyboard JSON.
- Notes are plain text (no rich formatting needed).
- A search bar at the top of the Notes panel filters across all character and location notes.

---

## 10. Total Word & Character Counter

**What it is**
A persistent live counter in the editor header (next to the autosave indicator) showing the total word count and character count of the currently open chapter or book.

**Why it matters**
The FlameButton already counts words for streak purposes. The raw total is never surfaced to the author in a persistent, always-visible way. Authors track word count obsessively — it should always be visible.

**Proposed placement**
Bottom of the editor, left of the existing "Saved ✓" timestamp and the reload button. Small, muted text: `1,204 words  ·  6,891 chars`.

**Implementation notes**
- Reuse the `countWords(html)` function already in `Streak.jsx`.
- Character count strips HTML tags first: `html.replace(/<[^>]*>/g, '').length`.
- Update on every `onInput` event (already firing in Editor).
- When Chapter Division is implemented, show both per-chapter and total-manuscript counts.
- The numbers should use `toLocaleString()` for comma formatting.

---

## 11. Writing Stats Dashboard

**What it is**
A dedicated analytics view showing the author's writing history: words written per day over the past month, average daily output, longest streak, total words per book, and session length trends.

**Proposed placement**
Shares the Book Metadata panel (feature #8) via a **Stats** tab. Accessible by clicking the book entry in the sidebar (once Chapter Division is implemented).

**Charts and metrics**
- **Daily words bar chart** — last 30 days, bars coloured by whether the daily goal was met.
- **Streak history** — current streak, longest streak, total days written.
- **Total words by book** — horizontal bar chart comparing all open books.
- **Average session length** — mean words per writing session.
- **Goal hit rate** — percentage of days the daily word goal was met this month.

**Implementation notes**
- All data already exists inside `session.streak.log` (the per-day word counts).
- Use a lightweight chart library (Chart.js is already available via CDN pattern used elsewhere in the app).
- Stats are calculated client-side from `.authbook` data — no server needed.

---

## 12. Weekly & Monthly Goals

**What it is**
Alongside the existing daily word goal, the author can also set a weekly target (e.g. 3,500 words/week) and a monthly target (e.g. 15,000 words/month). Progress toward all three is tracked simultaneously.

**Why it matters**
Some authors don't write every day but still maintain consistent output. A weekly or monthly goal is a better fit for their schedule than a streak that resets after one missed day.

**Implementation notes**
- Add `weeklyWordGoal` and `monthlyWordGoal` to `DEFAULT_SETTINGS` (both default to `null` = disabled).
- Add week/month preset pickers to Settings → Writing Goal, below the daily goal section.
- The FlameButton popup (streak calendar) gains a toggle between Daily / Weekly / Monthly view.
- Weekly view: a bar per day of the current week, with a horizontal "goal" line.
- Monthly view: the existing calendar grid, plus a progress bar at the top showing month-to-date total vs monthly goal.
- Streak logic for weekly/monthly: a "week met" or "month met" flag stored in the log alongside daily entries.

---

## 13. Light Mode

**What it is**
A full light colour scheme for the entire application, toggled via Settings → Appearance → Light Mode.

**Why it matters**
The toggle already exists in `Settings.jsx` and persists to localStorage. It simply has no effect — no CSS class is ever applied. This is a one-`useEffect` fix with a corresponding CSS pass.

**Implementation notes**
- In `App.js`, add a `useEffect` that watches `settings.lightMode`:
  ```js
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', settings.lightMode);
  }, [settings.lightMode]);
  ```
- In `index.css` (or `App.css`), define `.light-mode` overrides for every hardcoded dark colour in the app:
  - Background: `#060606` → `#f9f9f9`
  - Sidebar: `#0b0b0c` → `#f0f0f0`
  - Editor area: `#0f0f10` → `#ffffff`
  - Text: `#ffffff` → `#111111`
  - Borders: `rgba(255,255,255,0.1)` → `rgba(0,0,0,0.1)`
- The Background gradient blobs should use darker, more saturated colours in light mode so they remain visible against the light surface.

---

## 14. Scroll Position Memory

**What it is**
When the author switches between books or chapters, the editor restores the exact scroll position they were at when they last viewed that document — rather than resetting to the top.

**Why it matters**
Switching away from a book mid-paragraph and returning to find it back at line 1 is a constant interruption. This is a small detail that meaningfully reduces friction during multi-book sessions.

**Implementation notes**
- Keep a `scrollPositions` ref in `App.js`: `const scrollPositions = useRef({})`.
- On `handleSelect` (before switching), save the current scroll:
  ```js
  scrollPositions.current[currentId] = mainRef.current?.scrollTop ?? 0;
  ```
- After switching (in a `useEffect` that fires when `currentId` changes), restore:
  ```js
  if (mainRef.current) {
    mainRef.current.scrollTop = scrollPositions.current[currentId] ?? 0;
  }
  ```
- This is purely in-memory (not persisted to the `.authbook` file). If the app restarts, scroll resets — that is acceptable behaviour.
- When Chapter Division is implemented, key by `chapterId` instead of `sessionId`.
