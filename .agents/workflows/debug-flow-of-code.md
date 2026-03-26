---
description: Systematic debug workflow for tracing the full code flow across the Ozen application stack
---
// turbo-all

# Debug Flow of Code

This workflow walks through every layer of the Ozen system to identify and isolate bugs. Follow the steps in order, each one builds on the previous.

---

## Phase 1 — Static Analysis (Compile-Time)

1. **TypeScript Strict Check**
   ```bash
   npx tsc --noEmit
   ```
   Fix every error before proceeding. This catches missing exports, broken imports, and type mismatches.

2. **Grep for Conflict Markers**
   ```bash
   git diff --check HEAD
   ```
   Ensures no `<<<<<<<` / `>>>>>>>` markers are hiding anywhere in the repo.

---

## Phase 2 — Electron Main Process (`electron/main.ts`)

3. **Verify Ollama Spawn**
   Check that `spawn('ollama', ['serve'])` succeeds silently. If Ollama isn't on PATH, the app fails to provide AI.
   ```bash
   ollama --version
   ```

4. **Verify Window Creation**
   Confirm that `createOrbWindow()`, `createPanelWindow()`, and `createWindow()` all resolve. Check the dev console in each window for errors:
   - Orb: `/#/orb`
   - Panel: `/#/panel`
   - Hub: `/`

5. **IPC Channel Audit**
   Check that all `ipcMain.on(...)` handlers (`win-minimize`, `win-maximize`, `win-close`, `hide-panel`, `open-in-desk`, `resize-panel`) have matching `ipcRenderer.send(...)` calls in the renderer.

---

## Phase 3 — Data Layer (`src/lib/`)

6. **LocalStorage Round-Trip (`store.ts`)**
   Open DevTools Console → Run:
   ```js
   localStorage.getItem('ozen-settings')
   localStorage.getItem('ozen-ai-config')
   ```
   Verify settings and AI config persist correctly between reloads.

7. **Membrain API Health (`membrain.ts`)**
   ```bash
   curl https://mem-brain-api-cutover-v4-production.up.railway.app/api/v1/health
   ```
   If this fails, all memory features are offline. Check `.env` for `MEMBRAIN_API_KEY` and `MEMBRAIN_API_URL`.

8. **AI Config Effective Prompt (`aiProfiles.ts`)**
   Open DevTools Console → Run:
   ```js
   import('../lib/aiProfiles').then(m => console.log(m.getEffectivePrompt('desk')))
   ```
   Verify `userCustomInstructions` is appended when set.

---

## Phase 4 — React Hooks (`src/hooks/`)

9. **useOllama Flow**
   - Trigger a chat message in the Hub.
   - Watch the Network tab for `POST http://localhost:11434/api/chat`.
   - Confirm the `messages` array in the request body includes the system prompt with memory context.
   - Watch for background `POST` to Membrain (addMemory).

10. **useMemory Flow**
    - Switch to the Memory tab.
    - Watch for `GET /api/v1/graph/export` and `GET /api/v1/graph/hubs`.
    - If the Graph canvas is blank, check `graphData` state via React DevTools.

11. **useGroq Flow**
    - Switch provider to `groq` in Settings.
    - Send a message and watch for `POST https://api.groq.com/...` in the Network tab.
    - Confirm the response streams correctly.

---

## Phase 5 — UI Components (`src/components/`)

12. **Panel Rendering**
    - Type `@ozen` to summon the panel.
    - Inspect with DevTools: confirm the panel mounts at `/#/panel`, input is focused, and the resize IPC fires on expansion.

13. **Hub Tab Routing**
    - Click through every sidebar tab: Dashboard, Chat, Browser, Your AI, History, Memory, Agents, Settings.
    - Verify none produce a white screen (check console for React errors).

14. **MemoryView White-Screen Guard**
    - Navigate to Memory → Graph tab.
    - If the canvas is empty, check that `data?.nodes?.length` is truthy and `canvas.getContext('2d')` is not null.

15. **Message Rendering**
    - Send a message with markdown (code blocks, lists).
    - Confirm `react-markdown` + `remark-gfm` + `react-syntax-highlighter` render correctly.

---

## Phase 6 — End-to-End Integration

16. **Full Memory Loop**
    - Send a message like "Remember that I prefer dark mode."
    - Switch to Memory → Search tab → query "dark mode".
    - Verify the memory appears in results with the correct tags.

17. **Custom Instructions Injection**
    - Go to Your AI → "What Ozen should know about you" → type "Always respond in bullet points."
    - Save → Send a chat message → Verify the AI responds in bullet points.

18. **Cross-Window Communication**
    - In the Panel, click "Open in Desk" on a search result.
    - Verify the Hub window appears and navigates to the Browser tab with the correct URL.

---

## Phase 7 — Build Validation

19. **Production Build**
    ```bash
    npm run build
    ```
    Confirm zero errors and the `dist/` + `dist-electron/` directories are created.

20. **Final Git State**
    ```bash
    git status
    git log --oneline -5
    ```
    Confirm the working tree is clean and the latest commit message is descriptive.
