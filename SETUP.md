# PipelineLM Pro — Setup Guide

Commercial-grade orchestration dashboard for Google NotebookLM.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Chrome Extension │────▶│  Fleet Orchestrator│────▶│  NotebookLM   │
│  (pipelinelm-pro/) │◀────│  (server.js :8080) │◀────│  SDK/Web UI   │
└─────────────────┘     └──────────────────┘     └──────────────┘
                              │
                         ┌────▼────┐
                         │  Vault   │
                         │ Storage  │
                         └─────────┘
```

## Quick Start

### 1. Start the Server

```bash
cd C:/app/plp_kimi
npm install
PORT=8080 node server.js
```

Server runs on `http://localhost:8080`.

### 2. API Status Check

```bash
curl http://localhost:8080/api/status
```

Expected response: `{"status":"online","sdkAuthed":false,...}`

### 3. Authenticate with NotebookLM (optional)

```bash
npx notebooklm-sdk login
```

This opens a browser window to sign in with your Google account. After login, the SDK is ready.

### 4. Load the Extension (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `C:/app/plp_kimi/pipelinelm-pro/`
5. Click the PipelineLM icon in the toolbar to open the side panel
6. Complete the 5-step onboarding flow

### 5. Create a Notebook

1. Go to `https://notebooklm.google.com/`
2. Create a new notebook
3. Add sources (PDFs, web pages, text)
4. Generate Audio Overviews or other content

The extension auto-detects artifacts. The server scans them on `/api/artifacts/scan`.

## API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Server health, SDK status, queue count |
| GET | `/api/prefabs` | List 8 content templates with prompts |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project `{name, description, source, tags}` |
| GET | `/api/queue` | List all pipeline jobs |
| GET | `/api/artifacts` | List all generated artifacts |
| GET | `/api/artifacts/:id/download` | Download artifact file |
| GET | `/api/inspector/:artifactId` | Get artifact metadata |

### Vault Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vault/files` | List vault-stored files |
| POST | `/api/vault/upload` | Upload file `{name, type, data(base64)}` |
| POST | `/api/artifacts/:id/store` | Store artifact content to vault `{content, metadata}` |
| DELETE | `/api/vault/files/:id` | Delete vault file |
| DELETE | `/api/artifacts/:id` | Delete artifact |

### Pipeline Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Queue generation job `{prefabId, notebookId, topic, audience}` |
| POST | `/api/artifacts/scan` | Scan NotebookLM for new artifacts |
| POST | `/api/scrape` | Full fleet scrape (requires Playwright) |
| POST | `/api/bulk-download` | Bulk download `{ids: [...]}` |
| POST | `/api/bulk-store` | Bulk store `{ids: [...]}` |
| POST | `/api/artifacts/:id/rerender` | Re-render an artifact |

## WebSocket

Connect to `ws://localhost:8080/ws` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  console.log('Event:', msg.type, msg);
};
```

Events: `connected`, `health`, `job-created`, `job-updated`, `artifact-stored`, `artifact-deleted`, `vault-file-added`, `vault-file-removed`.

## Dashboard

The frontend dashboard is served at `http://localhost:8080/` and includes:

- **Dashboard tab**: Stats, recent artifacts, notebook list, server status
- **Pipeline tab**: Kanban board (queued → running → completed)
- **Vault tab**: Grid/list view with filters, search, bulk operations
- **Storage tab**: File upload drop zone and local file management

## Prefab Templates

| Template | Type | Best For |
|----------|------|----------|
| Deep-Dive Podcast | audio | Long-form educational content |
| Executive Briefing | report | Stakeholder updates |
| Explainer Video | video | Marketing and training |
| Investor Slide Deck | slides | Fundraising |
| Knowledge Mind Map | map | Brainstorming |
| Critique & Debate | audio | Balanced analysis |
| Tutorial Walkthrough | audio | Step-by-step guides |
| Competitive Analysis | report | Market intelligence |

## License

- **Free**: Core API, dashboard, vault storage (5 projects, 50 artifacts)
- **Pro**: Bulk operations, fleet scraping, Playwright integration, unlimited projects
- **Enterprise**: Custom deployment, SLA, priority support

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8080 in use | `taskkill //F //PID <pid>` or `PORT=3000 node server.js` |
| SDK auth fails | Run `npx notebooklm-sdk login` manually |
| Extension not loading | Check `chrome://extensions` errors, verify MV3 compatibility |
| No artifacts found | Create a notebook at notebooklm.google.com and generate content first |
| Playwright missing | `npm install playwright && npx playwright install chromium` |
