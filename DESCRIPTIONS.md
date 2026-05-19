<p align="center">
  <img src="docs/assets/logo-banner.png" alt="PipelineLM Pro" width="600">
</p>

<h1 align="center">PipelineLM Pro</h1>

<p align="center">
  <strong>The Ultimate NotebookLM Power-User Suite</strong><br>
  Generate studio items in bulk. Organize with folders & tags. Sync from anywhere. Study inline. All inside your browser.
</p>

<p align="center">
  <a href="https://github.com/yourusername/pipelinelm-pro/releases"><img src="https://img.shields.io/github/v/release/yourusername/pipelinelm-pro?include_prereleases&style=flat-square&color=3b82f6" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
  <a href="https://github.com/yourusername/pipelinelm-pro/issues"><img src="https://img.shields.io/github/issues/yourusername/pipelinelm-pro?style=flat-square&color=f59e0b" alt="Issues"></a>
  <a href="https://github.com/yourusername/pipelinelm-pro/stargazers"><img src="https://img.shields.io/github/stars/yourusername/pipelinelm-pro?style=flat-square&color=ec4899" alt="Stars"></a>
  <img src="https://img.shields.io/badge/chrome-114+-blue?style=flat-square&logo=googlechrome" alt="Chrome">
  <img src="https://img.shields.io/badge/brave-supported-orange?style=flat-square&logo=brave" alt="Brave">
</p>

---

## What is PipelineLM Pro?

**NotebookLM is brilliant. But it's missing things power users need.**

PipelineLM Pro is a free, open-source browser extension that injects directly into [Google NotebookLM](https://notebooklm.google.com), adding the features Google hasn't shipped yet:

- **9 studio item types** with granular configuration (Audio, Video, Slides, Quizzes, Flashcards, Mind Maps, Reports, Data Tables, Infographics)
- **AI prompt suggestions** that auto-detect your topic and audience from sources
- **Folder management** with drag & drop
- **Bulk source operations** (import URLs, YouTube playlists, RSS feeds, open tabs)
- **Study mode** with interactive quizzes and flashcards
- **Export everything** (PDF, Markdown, JSON, Text)
- **Dark mode**, **language switching**, **duplicate finder**, **source merging**
- **Multi-account switching** for Google Workspace users

All processing happens **locally in your browser**. Zero data collection. Zero external API calls. Your research stays yours.

---

## Features at a Glance

### Studio Item Generator (9 Types)

Pick from 9 output types, each with custom format, length, style, and difficulty controls:

| Type | Icon | Formats | Config Options |
|------|------|---------|----------------|
| Audio Overview | `audio` | Podcast, Narrative, Interview, News | Duration (3-45 min), Tone, Voice |
| Video Overview | `video` | Explainer, Documentary, Presentation, Tutorial | Duration, Visual Style, Music |
| Report | `report` | Executive Summary, Analytical, Research, Briefing | Length (1-10+ pages), Writing Style |
| Quiz | `quiz` | Mixed, MCQ, True/False, Open-Ended | Question Count (5-20), Difficulty |
| Flashcards | `flashcard` | Term-Definition, Q-A, Concept-Example, Cloze | Card Count (10-100), Complexity |
| Slide Deck | `slide_deck` | Presentation, Pitch, Training, Executive | Slides (5-25), Design, Density |
| Mind Map | `mind_map` | Radial, Tree, Organic, Flowchart | Depth (2-5 levels), Style, Connections |
| Data Table | `data_table` | Comparison, Summary, Timeline, Structured | Rows (10-100), Interactive |
| Infographic | `infographic` | Statistical, Process, Comparison, Hierarchy | Detail, Theme, Charts |

**Quick Generate Bar**: One-click buttons appear on every notebook page. Press `Ctrl+Shift+G` for full studio modal.

### AI Prompt Suggestions

- Auto-analyzes your notebook sources to detect **topic**, **audience**, and **recommended format**
- Generates up to 5 contextual prompts with confidence scores
- Pre-fills the prompt bar with detected topic and audience
- Type `/` in any chat input to trigger the shortcode picker

### Bulk Source Operations

| Method | How |
|--------|-----|
| Paste URLs | One per line, bulk-add all at once |
| YouTube Import | Paste playlist or channel URL |
| RSS/Sitemap | Pull every article from any feed |
| Open Tabs | One-click import all browser tabs |
| Webpage Links | Extract all links from any page |

### Study Mode

- **Quizzes**: Multiple choice, true/false, open-ended with real-time scoring
- **Flashcards**: Click to flip, Easy/Hard rating, prev/next navigation
- Keyboard shortcuts supported

### Additional Tools

- **Folder Manager** - Create folders, drag & drop notebooks, filter by folder
- **Tag System** - Color-coded tags with search and filter
- **Duplicate Finder** - Levenshtein-based title similarity detection
- **Source Merge** - Combine multiple sources into one with size validation
- **Freshness Checker** - Detect stale sources and refresh in bulk
- **Export Chat** - PDF, Markdown, JSON, or plain text
- **Backup/Restore** - JSON export/import of all extension data
- **Multi-Account** - Switch between Google accounts with color-coded avatars
- **Language Toggle** - 20 languages for AI output, floating widget on every page
- **Dark Mode** - Full dark theme, persists across sessions
- **Context Menu** - Right-click any page to send to NotebookLM
- **External Sync** - Import from Reddit threads, Google Docs, Claude chats

---

## Installation

### From Chrome Web Store (Recommended)

Coming soon - star this repo to get notified when it's live.

### Manual Installation (Developer Mode)

1. **Download** the latest release: [`pipelinelm-pro-v3.0.0.zip`](https://github.com/yourusername/pipelinelm-pro/releases/latest)
2. **Unzip** to a folder on your computer
3. Open **Chrome** or **Brave** and navigate to `brave://extensions` (or `chrome://extensions`)
4. Enable **Developer Mode** (toggle in top-right corner)
5. Click **Load unpacked** and select the unzipped folder
6. Go to [notebooklm.google.com](https://notebooklm.google.com) and click the ⚡ icon

### From Source (For Developers)

```bash
git clone https://github.com/yourusername/pipelinelm-pro.git
cd pipelinelm-pro
# Load the `src/` folder as an unpacked extension
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Open Prompt Library |
| `Ctrl+Shift+G` | Open Studio Generator |
| `Ctrl+Shift+S` | Open Side Panel |
| `/` in chat | Trigger prompt shortcode picker |

---

## Architecture

```
src/
  manifest.json          # Extension manifest (MV3)
  background/
    sw.js                # Service worker - context menus, sync, storage
  content/
    content.js           # Main content script - all UI injection
    content.css          # Injected styles - dark mode, components
  sidepanel/
    sidepanel.html       # 7-tab side panel (Dashboard, Vault, Pipeline, Folders, Prompts, Sync, Settings)
    sidepanel.js         # Side panel controller
    sidepanel.css        # Side panel styles with dark/light theme
  shared/
    constants.js         # Artifact types, prefabs, storage keys
    utils.js             # Formatters, escape, hash, debounce
    ai-analyzer.js       # Topic detection, audience inference, format suggestion
    studio-config.js     # Studio type definitions, languages, generation prompts
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
  _locales/en/
    messages.json        # Localized strings
```

**Data Flow:**
1. Content script scrapes NotebookLM DOM for sources, chat, metadata
2. AI analyzer runs local NLP (no external API) to detect topic/audience
3. Studio generator builds contextual prompts from templates
4. Service worker handles cross-origin fetches (Reddit, Google Docs) and downloads
5. All data stored in `chrome.storage.local` - zero external servers

---

## Privacy & Security

- **100% client-side**: All processing happens in your browser
- **No external API calls**: Zero data sent to any server
- **No tracking**: No analytics, no telemetry, no cookies
- **No Google API access**: Works by DOM scraping, not OAuth
- **Open source**: Full transparency - you can audit every line
- **Minimal permissions**: Only requests what's needed (storage, downloads, activeTab, sidePanel)
- **Data isolation**: Per-account storage separation for multi-account users

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Quick start for contributors:

```bash
git clone https://github.com/yourusername/pipelinelm-pro.git
cd pipelinelm-pro
```

1. Make your changes in `src/`
2. Test by loading `src/` as an unpacked extension
3. Run `npm run lint` to check code style
4. Submit a pull request

### Areas we need help with:

- [ ] Chrome Web Store listing preparation
- [ ] Safari extension port (Manifest V3 compatible)
- [ ] Firefox Add-on port
- [ ] Additional language translations
- [ ] Studio item type templates (improving prompt quality)
- [ ] Visual design improvements
- [ ] Test suite expansion

---

## Roadmap

| Version | Features |
|---------|----------|
| **v3.0** (Current) | 9 studio types, AI suggestions, study mode, bulk sources, folders, tags, dark mode |
| **v3.1** | Chrome Web Store launch, Safari support, improved AI templates |
| **v3.2** | Collaborative features, shared prompt libraries, team folders |
| **v4.0** | Standalone dashboard (separate from NotebookLM), advanced analytics |

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/pipelinelm-pro&type=Date)](https://star-history.com/#yourusername/pipelinelm-pro&Date)

---

## License

[MIT License](LICENSE) - Free for personal and commercial use.

Built with care by the community. Not affiliated with Google or NotebookLM.

---

<p align="center">
  <a href="https://github.com/yourusername/pipelinelm-pro/stargazers">Star this repo</a> •
  <a href="https://github.com/yourusername/pipelinelm-pro/issues">Report a bug</a> •
  <a href="https://github.com/yourusername/pipelinelm-pro/discussions">Discuss</a> •
  <a href="docs/INSTALLATION.md">Docs</a>
</p>
