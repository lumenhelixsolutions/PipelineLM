# PipelineLM

<p align="center">
  <a href="https://lumenhelix.com">
    <img src="docs/assets/lumenhelix-logo.svg" alt="LumenHelix Solutions" width="180">
  </a>
</p>

<h3 align="center">Chrome extension power-suite for Google NotebookLM</h3>

<p align="center">
  <a href="https://lumenhelixsolutions.github.io/PipelineLM/">
    <img src="https://img.shields.io/badge/Launch_Page-PipelineLM-00D4FF?style=flat-square&logo=githubpages&logoColor=white" alt="Launch Page">
  </a>
  <a href="https://lumenhelix.com">
    <img src="https://img.shields.io/badge/Built_by-LumenHelix-7C3AED?style=flat-square" alt="Built by LumenHelix">
  </a>
  <img src="https://img.shields.io/badge/license-MIT-8A95A8?style=flat-square" alt="License">
</p>

---

**PipelineLM** is part of the [LumenHelix Solutions](https://lumenhelix.com) portfolio — applied symbolic dynamics & reversible computation for deterministic, traceable AI systems.

PipelineLM is the LumenHelix Chrome extension power-suite for Google NotebookLM. It injects a side panel with prompt studio, bulk source management, smart folders, fleet scanner, and one-click exports — all processed client-side with zero external API calls.

## Why this exists

- **Stay private.** All processing happens in the browser; no data leaves your machine.
- **Work faster.** Context-menu additions and bulk operations cut notebook management time.
- **Own your prompts.** Saved prompt libraries and exports travel with your extension data.

## Quick start

Install and run PipelineLM in under two minutes.

### macOS / Linux

```bash
# Clone
git clone https://github.com/lumenhelixsolutions/PipelineLM.git
cd PipelineLM

# Install & run
git clone https://github.com/lumenhelixsolutions/PipelineLM.git
cd PipelineLM
npm install
npm run build
# Load dist/ as an unpacked extension in chrome://extensions
```

### Windows (PowerShell)

```powershell
# Clone
git clone https://github.com/lumenhelixsolutions/PipelineLM.git
Set-Location PipelineLM

# Install & run
git clone https://github.com/lumenhelixsolutions/PipelineLM.git
Set-Location PipelineLM
npm install
npm run build
# Load dist/ as an unpacked extension in chrome://extensions
```

### Windows (Git Bash / WSL)

```bash
git clone https://github.com/lumenhelixsolutions/PipelineLM.git
cd PipelineLM
git clone https://github.com/lumenhelixsolutions/PipelineLM.git
cd PipelineLM
npm install
npm run build
# Load dist/ as an unpacked extension in chrome://extensions
```

> **Device note:** PipelineLM is tested on Windows 11, macOS Sonoma, Ubuntu 22.04/24.04, and modern mobile browsers.

## Full documentation

Visit the launch page for architecture, API reference, and deployment guides:  
**https://lumenhelixsolutions.github.io/PipelineLM/**

## Features

| Feature | What it gives you |
|---------|-------------------|
| Prompt studio | Save, organize, and reuse prompts across notebooks with topic-aware suggestions. |
| Bulk source management | Add pages, links, and selected text as sources directly from the context menu. |
| Smart folders & fleet scanner | Organize notebooks with folders and tags, then scan your fleet for status and updates. |
| One-click exports | Export studio items and notes to PDF, Markdown, and other formats without leaving the browser. |

## Architecture at a glance

```
PipelineLM/
├── manifest.json      Chrome extension manifest
├── sidepanel.html     Sidebar UI entry point
├── content.js         NotebookLM page integration
├── ai-analyzer.js     Local analysis and prompt logic
├── studio-config.js   Studio item configuration
└── scripts/           Build, validation, and packaging helpers
```

## Development

```bash
# Install dependencies and build
npm install
npm run dev

# Or build once and load dist/ unpacked
npm run build
```

## Roadmap

- [ ] Firefox and Chromium-family port
- [ ] Syncable prompt and folder backups
- [ ] Inline study mode with spaced-repetition cards

## Support & consulting

Need deterministic AI systems with full traceability? LumenHelix builds reversible computation kernels, governance layers, and end-to-end AI integrations.

- **Website:** https://lumenhelix.com
- **Services:** AI diagnostics, B.Y.O. support packages, governance audits
- **Research:** TEN² kernel, R.U.B.I.C. boundary discipline, C.O.R.E. constraint lens

## License

Released under the MIT License.

---

<p align="center">
  <sub>Engineered by <a href="https://lumenhelix.com">LumenHelix Solutions</a> — Applied Symbolic Dynamics & Reversible Computation.</sub>
</p>
