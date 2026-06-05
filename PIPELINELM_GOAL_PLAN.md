# PipelineLM Pro — Goal Plan (Updated)

## Project Overview
**PipelineLM Pro** — commercial-grade orchestration dashboard for Google NotebookLM.
- Chrome Extension (MV3) targeting `notebooklm.google.com` — content script, service worker, sidepanel
- Node.js Fleet Orchestrator (~1,422 lines) — 27+ REST endpoints, WebSocket, Playwright, file watcher
- Web frontend (92KB dashboard)
- 8 prefab templates, vault storage, artifact pipeline, license system

## Current State (Post-Recent Updates)

### ✅ What's Fixed & Working
| Component | Status | Details |
|-----------|--------|---------|
| Server boot | Complete | Starts on PORT 8080, no fatal dependency errors |
| Production middleware | Complete | Request logging, CORS, X-Powered-By, error handlers |
| Graceful shutdown | Complete | SIGTERM/SIGINT handlers, 10s forced timeout |
| SDK auth | Complete | `connect()` → tokens → constructor pattern works |
| SDK error messages | Complete | Actionable guidance for auth/CSRF failures |
| Vault store | Complete | Writes `req.body.content` to disk, handles metadata JSON |
| Async route error handling | Complete | All async routes wrapped in try/catch |
| Extension sidepanel | Complete | Server status indicator (online/offline badge) |
| SETUP.md documentation | Complete | Full quick-start, API reference, troubleshooting |

### 📋 Codebase Inventory
| Component | Lines / Size | Location |
|-----------|-------------|----------|
| Server | ~1,422 lines | `server.js` |
| Extension manifest | 16 lines | `pipelinelm-pro/manifest.json` |
| Sidepanel HTML | 120 lines | `pipelinelm-pro/sidepanel/sidepanel.html` |
| Sidepanel JS | 214 lines | `pipelinelm-pro/sidepanel/sidepanel.js` |
| Background SW | 123 lines | `pipelinelm-pro/background/sw.js` |
| Content script | 151 lines | `pipelinelm-pro/content/content.js` |
| Shared constants/utils | ~30 lines | `pipelinelm-pro/shared/` |
| Dashboard frontend | 92KB inline | `public/index.html` |
| Prefabs | 8 templates | Embedded in `server.js` |

---

## Phase 1 — Integration Smoke Test (Critical Path)
**Goal:** Verify the entire stack boots and communicates end-to-end.

| # | Task | Acceptance Criteria | Est. Effort |
|---|------|---------------------|-------------|
| 1.1 | Start server & hit `/api/status` | Returns `{"status":"online",...}` with no exceptions | 15 min |
| 1.2 | Verify WebSocket | `ws://localhost:8080/ws` connects, receives `connected` event | 15 min |
| 1.3 | Load extension in Chrome | `chrome://extensions` → Load unpacked → no manifest errors | 10 min |
| 1.4 | Sidepanel onboarding | Complete 5-step onboarding flow, license key saved | 10 min |
| 1.5 | Server status indicator | Green "Server Online" badge appears in Dashboard tab | 5 min |
| 1.6 | Dashboard served at root | `http://localhost:8080/` loads 92KB UI without CSP errors | 10 min |

**Deliverable:** All 6 checks pass. Document any runtime errors in `TROUBLESHOOTING.md` appendix.

---

## Phase 2 — Content Script & NotebookLM Integration
**Goal:** Extension correctly detects notebooks and artifacts on `notebooklm.google.com`.

| # | Task | Acceptance Criteria | Est. Effort |
|---|------|---------------------|-------------|
| 2.1 | Notebook list scraping | Visit `/notebooks` → content script finds cards → SW stores notebook IDs | 30 min |
| 2.2 | Single notebook detection | Open a notebook → content script extracts `notebookId` from URL | 15 min |
| 2.3 | Artifact scraping | Generate an Audio Overview → content script detects it via button/media selectors | 30 min |
| 2.4 | Sync flow | Click "Sync" in sidepanel → triggers scan → artifacts appear in Vault tab | 20 min |
| 2.5 | Prefab injection toolbar | Quick-launch pill appears on notebook pages → injects prompt into textarea | 20 min |
| 2.6 | MutationObserver resilience | DOM changes (generating → completed) trigger re-scrape within 1.2s | 15 min |

**Deliverable:** Notebook and artifact counts in sidepanel match actual NotebookLM state.

---

## Phase 3 — Server API Deep Test
**Goal:** All 27+ endpoints return correct data and handle edge cases.

| # | Task | Acceptance Criteria | Est. Effort |
|---|------|---------------------|-------------|
| 3.1 | Prefabs endpoint | `GET /api/prefabs` returns all 8 templates with icons | 10 min |
| 3.2 | Project CRUD | Create, read, update, delete projects; cascade deletes artifacts & queue jobs | 20 min |
| 3.3 | Generate / Queue | `POST /api/generate` creates job → progresses queued → running → completed | 20 min |
| 3.4 | Artifact scan (SDK) | With valid SDK auth, `/api/artifacts/scan` discovers artifacts and counts by type | 20 min |
| 3.5 | Artifact scan (no SDK) | Without auth, returns `503` with actionable error message | 10 min |
| 3.6 | Vault upload / list / delete | Upload base64 file → listed → deleted; file watcher broadcasts WS events | 20 min |
| 3.7 | Store artifact locally | `POST /api/artifacts/:id/store` with content writes real file to `vault-storage/` | 15 min |
| 3.8 | Download artifact | `GET /api/artifacts/:id/download` serves file or redirects to `downloadUrl` | 15 min |
| 3.9 | Bulk operations | Bulk download & bulk store handle 10+ artifacts without timeout | 20 min |
| 3.10 | Re-render | `POST /api/artifacts/:id/rerender` queues new job from existing artifact | 15 min |
| 3.11 | Inspector | `GET /api/inspector/:id` returns CDI, word count, paragraph count | 10 min |
| 3.12 | Reset endpoint | `POST /api/reset` clears projects, artifacts, queue; optional vault wipe | 10 min |
| 3.13 | Auth sync | `POST /api/auth/sync` spawns `npx notebooklm-sdk login` process | 15 min |
| 3.14 | Health endpoint | `GET /api/health` returns uptime, memory, WS clients, error count | 10 min |
| 3.15 | Fleet endpoint | `GET /api/fleet` returns notebook inventory (SDK or cached) | 10 min |
| 3.16 | Playwright scrape | `POST /api/scrape` launches Chromium, scrapes inventory notebooks | 30 min |
| 3.17 | Notebook scan | `POST /api/notebooks/scan` scrapes selected notebook IDs | 20 min |

**Deliverable:** All endpoints tested with `curl`/dashboard; no unhandled 500s.

---

## Phase 4 — Real Artifact Pipeline (SDK Integration)
**Goal:** Replace simulated `processJob` delays with actual NotebookLM SDK artifact generation.

| # | Task | Acceptance Criteria | Est. Effort |
|---|------|---------------------|-------------|
| 4.1 | SDK prompt push | `client.chat.setChatConfig()` or equivalent pushes prompt to notebook | 1–2 hrs |
| 4.2 | Poll for completion | Background interval polls notebook for artifact generation status | 1–2 hrs |
| 4.3 | Artifact retrieval | On completion, fetch artifact metadata via SDK and persist to `.data/` | 1–2 hrs |
| 4.4 | Download media | Use SDK download methods to save audio/video files to vault | 2–3 hrs |
| 4.5 | Progress tracking | Job `progress` field reflects real generation % (or SDK stages) | 1 hr |
| 4.6 | Failure recovery | If generation fails, job status = `failed`, error logged, WS broadcast | 1 hr |

**Deliverable:** A prefab job queued from the dashboard results in a real artifact inside NotebookLM.

---

## Phase 5 — Extension Hardening
**Goal:** Content script and SW are resilient to NotebookLM UI changes.

| # | Task | Acceptance Criteria | Est. Effort |
|---|------|---------------------|-------------|
| 5.1 | Selector fallback strategy | Try 3+ selectors per element type before giving up | 1 hr |
| 5.2 | Rate limiting | MutationObserver debounced at 1.2s; no excessive re-scrapes | 30 min |
| 5.3 | Error telemetry | Content script logs scrape errors to SW → health log | 30 min |
| 5.4 | Offline support | Sidepanel works with cached data when server is offline | 1 hr |
| 5.5 | Badge updates | Extension action badge shows pending artifact count | 30 min |

---

## Phase 6 — Commercial Polish
**Goal:** Production-ready packaging and license enforcement.

| # | Task | Acceptance Criteria | Est. Effort |
|---|------|---------------------|-------------|
| 6.1 | License backend validation | Server validates license key format; Pro features gated | 2 hrs |
| 6.2 | Feature tiers | Free (5 projects, 50 artifacts), Pro (unlimited + bulk + scrape) | 1–2 hrs |
| 6.3 | Dashboard cleanup | 92KB inline file split into modular CSS/JS or at least organized | 2–3 hrs |
| 6.4 | Build script | `npm run build` packages extension into `pipelinelm-pro.zip` | 1 hr |
| 6.5 | Health check script | `scripts/health-check.js` validates server + extension readiness | 1 hr |
| 6.6 | README for users | Human-facing setup guide (separate from SETUP.md) | 1 hr |

---

## Recommended Approval Order

**Approve Phase 1 first** — it is the critical path. Without a running server and loaded extension, Phases 2–6 are blocked.

After Phase 1 passes, Phases 2 and 3 can proceed in parallel (one person tests NotebookLM integration, another tests API endpoints). Phase 4 is the highest-value feature work but depends on 1–3. Phases 5–6 are polish and can be deferred to a v1.1 if time-constrained.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| notebooklm-sdk API changes | Medium | High | Wrap SDK calls in adapter functions; fallback to scraping |
| NotebookLM UI redesign breaks selectors | High | Medium | Multi-selector fallback + Playwright scrape as backup |
| Playwright not installed on user machine | Medium | Medium | Graceful degradation; scrape disabled if missing |
| 92KB dashboard becomes unmaintainable | Medium | Medium | Phase 6.3 modularization |
| License key validation needs external service | Low | Low | Start with local regex/format validation |

---

## Success Criteria for v1.0

1. Server starts cleanly with `npm start`
2. Extension loads in Chrome with zero manifest errors
3. User can open NotebookLM, click Sync, and see artifacts in sidepanel
4. User can queue a prefab job and it completes (simulated or real)
5. Vault storage persists files across server restarts
6. Dashboard displays stats, pipeline, and vault without console errors
7. SETUP.md enables a new developer to be productive in <15 minutes
