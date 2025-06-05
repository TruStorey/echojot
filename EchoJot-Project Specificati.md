# 📘 Echo Jot — Project Specification (Final Version)

## 🧠 Overview

**Echo Jot** is a local-first, markdown-based journaling and productivity web app. It emphasizes:

* Daily journaling with rich, typed blocks
* Keyboard-first Markdown & slash command UI
* Linked note blocks, todos, and reminders
* Clean file system architecture with full offline support
* Smart linking, tagging, and index generation
* Local storage using the File System Access API

---

## 🧱 Note Block Types

| Shortcut | Type    | Description                       | Icon |
| -------- | ------- | --------------------------------- | ---- |
| `;p`     | Penny   | Loose thoughts, mental dumps      | 💭   |
| `;i`     | Idea    | Creative sparks, future projects  | 💡   |
| `;r`     | Reflect | Insights, lessons, retrospectives | 🧠   |
| `;d`     | Dark    | Private, encrypted entries        | 🔒   |
| `;t`     | Todo    | Tasks/checklists                  | 📋   |

Each block includes:

* Timestamp (`createdAt`) in ISO format
* Markdown content with frontmatter (metadata)
* A copy-to-clipboard button that copies the note block in markdown syntax

---

## 🖼 Layout Structure

* **Timeline Area** (centered, \~50% width by default)

  * Displays vertical timeline with icons aligned to the center line
  * Configurable in settings to expand to full width
  * Displays reminders and todos first, then note blocks in order of creation
  * Each note block shows timestamp, icon, and content

* **Sidebar Navigation** (fixed to the left)

  * **Home**: Returns to timeline view
  * **Calendar**:

    * Shows current month view
    * Dates with existing entries are highlighted or marked
    * Clicking a day jumps to that day's timeline
  * **Tags**:

    * Displays top 10 most-used tags
    * Clicking a tag filters blocks by tag
  * **Footer Controls**:

    * Link to **Settings** page
    * Toggle switch for **Dark/Light Mode**

---

## 🔤 Input Commands

| Command            | Effect                               |
| ------------------ | ------------------------------------ |
| `/`                | Slash menu: block types + formatting |
| `/x` or `↵↵`       | Exit current block                   |
| `@`                | Link to note (opens search menu)     |
| `@@`               | Link to todo (search + autocomplete) |
| `#tag`             | Tag current block                    |
| `!3d`, `!tomorrow` | Set reminder for this block          |

* Markdown shortcuts like `**bold**`, `_italic_`, etc. are supported
* Markdown syntax is parsed on-the-fly into styled content (WYSIWYG-style)

---

## 📂 File Structure (Per Day)

```
echo-jot/
└── 2025-06-01/
    ├── penny-quick-thoughts.md
    ├── idea-ui-sketch.md
└── 2025-06-02/
    ├── remind-check-feedback.md
└── 2025-06-04/
    ├── todo-design-ui.md
```

* Files are named using `<type>-<slug>.md`
* Todos and reminders are saved in the folder for their `doDate` or `reminderDate`
* Notes that reference those blocks store backlinks via `linkedTodos` / `linkedReminders`

---

## 🔐 Encryption

* Dark entries are encrypted using the Web Crypto API (AES-GCM)
* A single passphrase unlocks all dark notes, and users must re-enter it per session
* If browser data is lost, dark entries can still be unlocked with the same passphrase

---

## 🧾 User Preferences & Settings

* Stored in `settings.json` in the root directory
* Contains:

  * Theme: light/dark
  * Time format: 12h/24h
  * Start of week (e.g. Monday)
  * Stats (e.g. number of folders, notes by type, total todos/reminders)
* Folder path is also remembered via IndexedDB handle
* Settings UI allows folder re-selection and shows summary stats

---

## 🧭 Timeline UI

* Displays today + 7 previous days (expandable)
* Each block shown with:

  * Icon by type (🧠 💭 💡 🔒 📋) aligned to the vertical timeline line
  * Creation time (e.g. 10:34) to the left of the icon
  * Visual separator for each day
* Scrollable timeline view
* Todos/reminders appear both on their scheduled date and on the day they were authored via backlinks

### 🧭 Daily View Example Layout

```
2025-06-05
             | 
🔔 this is an example reminder
             | 
📋 do this thing
📋 do this other thing
             | 
15:46 🧠 - Note title
             |     This is an example of a note
             |     It has some other things here
             |     The end
15:51 💡 - Another note title
             |     Another note block example

2025-06-06
```

---

## 🔗 Linking & Backlinking

* `@<filename>` links to a note block
* `@@<task-id>` links to a todo
* UI shows superscript emoji icon (🧠, 📋, etc.)
* Search dropdown appears when typing `@` or `@@`
* Title pulled from `title` in frontmatter or first content line
* Backlinks tracked in `linkedBy`
* Bidirectional: link resolution and backlink tracing
* **Todos and reminders are also visible on the day they were created** by backlinking to the note where they were first authored

---

## 🔎 Search & Fuzzy Indexing

* App scans recent folders on load (e.g. past 30 days)
* Parses frontmatter using `gray-matter`
* Stores a lightweight in-memory index for fast querying:

```ts
{
  notes: [ { slug, title, createdAt, tags, type }, ... ],
  todos: [ ... ],
  reminders: [ ... ]
}
```

* Uses `fuse.js` for fuzzy searching titles, tags, and optionally content
* Powers dropdowns and global search UI

---

## 🛠 Offline & Performance

* PWA installable with manifest + icons
* Custom service worker (e.g. via Workbox) caches static assets
* Full offline support except for first-time folder selection (FS API re-prompted if session lost)

---

## 🧱 Technical Stack

| Layer            | Tool                       |
| ---------------- | -------------------------- |
| Framework        | **Next.js**                |
| Styling          | **Tailwind CSS v4**        |
| UI Components    | **shadcn/ui**              |
| File Storage     | **File System Access API** |
| Markdown Parsing | `gray-matter`, `remark`    |
| Fuzzy Search     | `fuse.js`                  |
| Deployment       | **Vercel** (PWA ready)     |

---

## ✅ MVP Feature Checklist

* Note blocks with keyboard-driven creation
* Todos with doDate, linkable metadata
* Reminders scheduled and linked to notes
* File-based journal folder structure
* All data in `.md` files (with frontmatter only)
* Smart `@` and `@@` linking with dropdown UI
* Superscript emoji visual indicators
* Offline support via FS API
* Tagging and searchability
* Timeline UI with day markers and scroll
* Notes show references to todos/reminders they created
* Todos/reminders show backlinks to authoring notes
* WYSIWYG-style editing for Markdown (no syntax shown after typing)
* Slash menu and Markdown shortcuts integration
* Settings UI and folder picker with persistent IndexedDB storage
* User-defined date/time formatting
* Focus/blur styling cues and `Ctrl+↑/↓` navigation
* Auto-save with visual feedback (3s debounce)
