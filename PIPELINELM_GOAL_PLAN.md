# PipelineLM Pro — Goal Plan

## Project Overview
**PipelineLM Pro** — commercial-grade orchestration dashboard for Google NotebookLM.
- Chrome Extension (MV3) targeting `notebooklm.google.com` — content script, service worker, sidepanel
- Node.js Fleet Orchestrator (1211 lines) — 27+ REST endpoints, WebSocket, Playwright, file watcher
- Web frontend (92KB dashboard)
- 6 prefab templates, vault storage, artifact pipeline, license system

## Current State
| Component | Lines | Status |
|-----------|-------|--------|
| Server (server.js) | 1,211 | Complete — all routes wired |
| Extension (pipelinelm-pro/) | ~630 | Complete — sidepanel, background, content, onboard |
| Shared (constants/utils) | ~10 | Complete |
| Frontend (public/index.html) | 92KB | Built — dashboard UI |
| Prefabs (prefabs.json) | 65 | 6 templates defined |
| Dependencies | express, ws, playwright, chokidar, js-yaml | All installed |
| `.data/`, `vault-storage/`, `ingestion/` | Empty | Never run — no data populated |
| Port | 8080 | Default, not yet tested |

## What's Working
- Extension builds loadable (MV3 manifest, all source files present)
- Server requires no build step (raw Node.js)
- All npm dependencies installed
- Onboarding flow complete with license key entry
- Sidepanel has 4 tabs (Dashboard, Vault, Pipeline, Storage)
- Prefab templates with topic/audience substitution

## What Needs Attention

### Phase A — Make It Run (integration testing)
1. **Start server, verify API** — `node server.js` on port 8080, hit `/api/status`
2. **Load extension in Chrome** — verify sidepanel opens, onboarding works
3. **Test prefab injection into NotebookLM** — content script communication
4. **Fix any runtime errors** from missing SDK/Playwright integration

### Phase B — Data & Vault (core functionality)
5. **Populate vault storage** — test vault upload/store/download endpoints
6. **Artifact pipeline** — test generate → queue → scan → store flow
7. **Fleet polling** — verify background notebook inventory works

### Phase C — Polish & Commercial
8. **Error handling** — all 27+ API routes need proper try/catch + error responses
9. **Frontend state management** — 92KB dashboard needs cleanup/maintenance
10. **License enforcement** — Free vs Pro feature gating
11. **Usage documentation** — setup guide for new users

## Proposed First Step
**Phase A, item 1**: Start the server, verify all 27+ endpoints respond. Fix any boot failures. This is the critical path — without a running server, nothing else works.
