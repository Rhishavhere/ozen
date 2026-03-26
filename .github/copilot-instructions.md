# Ozen - Copilot Development Instructions

## Project Overview

**Ozen** is a desktop-grade AI assistant that lives as an ambient OS layer, triggered globally by typing `@ozen`. It's an Electron app with a React frontend that provides contextual AI assistance without leaving your workflow.

**Core Innovation**: Multi-window Electron architecture with cursor tracking, semantic memory via Membrain, and local AI inference via Ollama.

---

## Build, Test, and Lint Commands

### Main App (`/ozen`)

```bash
# Development
npm run dev              # Start Vite dev server with Electron

# Production Build
npm run build            # TypeScript compile → Vite build → Electron builder

# Code Quality
npm run lint             # ESLint with TypeScript rules
npm run preview          # Preview production build

# Prerequisites
ollama run gemma3:1b     # Pull and verify default local AI model
```

### MCP Server (`/mcpa`)

```bash
# The Membrain MCP server runs independently
# Configured via .env file with MEMBRAIN_API_KEY and MEMBRAIN_API_URL
```

**Note**: No test suite currently exists. Testing is manual via the Electron app.

---

## Architecture Overview

### Three-Window System

Ozen uses Electron's multi-window capabilities to run three concurrent rendering processes:

| Window | Purpose | Route | Characteristics |
|--------|---------|-------|-----------------|
| **The Orb** | Ambient cursor-tracking status indicator | `/#/orb` | 60x60px, frameless, transparent, click-through, always-on-top |
| **The Panel** | Floating AI chat interface | `/#/panel` | 400x60px (collapsed) → 400x400px (expanded), frameless, transparent, screen-saver level |
| **The Hub** | Settings, memory graph, full chats | `/` | Standard framed window, accessible from tray |

### Key Files & Responsibilities

```
ozen/
├── electron/
│   ├── main.ts              # Main process: window orchestration, IPC handlers, global hotkey
│   └── preload.ts           # IPC bridge for renderer security
├── src/
│   ├── components/
│   │   ├── Panel.tsx        # Main AI chat interface
│   │   ├── Orb.tsx          # Cursor-tracking status orb
│   │   └── ErrorBoundary.tsx # React error boundary (wraps all routes)
│   ├── hooks/
│   │   ├── useOllama.ts     # Local AI inference via Ollama
│   │   ├── useGroq.ts       # Cloud AI fallback via Groq
│   │   └── useKeyboard.ts   # Global keyboard input handling
│   └── lib/
│       ├── membrain.ts      # Semantic memory service client
│       └── store.ts         # Persistent state (API keys, preferences)
└── vite.config.ts           # Vite + Electron integration
```

### Data Flow: User Query → AI Response

1. **User types `@ozen`** anywhere → `uiohook-napi` detects sequence
2. **Main process** calls `getCursorScreenPoint()` and spawns Panel window at cursor
3. **Panel window** steals focus, user enters query
4. **IPC message** `resize-panel` expands window upward (maintains cursor position)
5. **Panel** fetches streaming response from:
   - Local: Ollama API (`http://localhost:11434/api/generate`)
   - Cloud fallback: Groq API
   - Memory: Membrain semantic search
6. **User presses Esc** → IPC `hide-panel` → `minimize()` then `hide()` → focus returns to previous app
7. **Panel state reset** after 300ms (messages cleared, size collapsed)

---

## Code Conventions

### 1. Error Handling (CRITICAL)

**All error handling patterns are documented in `ERROR_HANDLING_GUIDE.md`.** Key rules:

- **Wrap all async operations in try-catch**:
  ```typescript
  try {
    const result = await riskyOperation();
  } catch (err: any) {
    console.error('Operation failed:', err);
    showUserFeedback(err.message);
  }
  ```

- **Use timeout utility for all fetch operations** (30-second default):
  ```typescript
  const response = await fetchWithTimeout(url, options, 30000);
  ```

- **Protect Promise.all() calls**:
  ```typescript
  try {
    const [data1, data2] = await Promise.all([fetch1(), fetch2()]);
  } catch (err) {
    console.error('Failed to load data:', err);
  }
  ```

- **Always catch background promises**:
  ```typescript
  backgroundOperation().catch(err => console.error('Background error:', err));
  ```

### 2. IPC Communication Patterns

All IPC handlers in `electron/main.ts` follow this structure:

```typescript
ipcMain.on('handler-name', (_event, arg) => {
  try {
    // 1. Validate input
    if (!arg || typeof arg !== 'expected-type') {
      console.error('Invalid argument:', arg);
      return;
    }

    // 2. Check resource state
    if (!window || window.isDestroyed()) {
      console.warn('Window not available');
      return;
    }

    // 3. Perform operation
    window.doOperation(arg);
  } catch (err) {
    console.error('Handler error:', err);
  }
});
```

**Available IPC channels** (from preload bridge):
- `resize-panel`: Expand/collapse Panel window
- `hide-panel`: Minimize and hide Panel, return focus
- `show-hub`: Open Hub window
- `get-clipboard`: Read system clipboard
- `write-clipboard`: Write to system clipboard

### 3. React Error Boundaries

All routes are wrapped in `<ErrorBoundary>` (see `src/components/ErrorBoundary.tsx`). This catches React rendering errors and shows a fallback UI instead of blank screens.

### 4. AI Model Integration

**Ollama (Local)**:
- Default model: `gemma3:1b`
- Endpoint: `http://localhost:11434/api/generate`
- Streaming: Parse NDJSON chunks
- Fallback: If Ollama unavailable, use Groq

**Groq (Cloud)**:
- Fast cloud inference for fallback
- Requires API key in settings
- Models: `mixtral-8x7b-32768`, `llama-3.1-70b-versatile`

**Membrain (Memory)**:
- Semantic search: `POST /api/v1/memories/search`
- Create memory: `POST /api/v1/memories` (returns job ID, requires polling)
- Response format: `interpreted` (LLM-generated summary)

### 5. Global Hotkey System

**Detection**: The `uiohook-napi` library monitors all keyboard input globally. When user types `@ozen` (letter by letter, within 2s window), the Panel spawns.

**Implementation** (`electron/main.ts`):
```typescript
uIOhook.on('keydown', (e) => {
  // Accumulate keystrokes
  // Match "@ozen" sequence
  // Call createPanelWindow(cursorX, cursorY)
});
```

**Important**: Global keyboard hooks require native modules. External property `uiohook-napi` in `vite.config.ts` rollup options.

### 6. Window Focus Management

When dismissing the Panel via `Esc`:
1. Call `panelWin.minimize()` — triggers OS to return focus to previous app
2. Wait 100ms (OS transition)
3. Call `panelWin.hide()` — removes window from screen
4. Wait 200ms
5. Reset Panel state (messages, input, size)

This sequence ensures the user's original text field regains focus seamlessly.

---

## Important Patterns

### Cursor Tracking (The Orb)

The Orb tracks the cursor at ~60fps using `setInterval` in the main process:

```typescript
setInterval(() => {
  if (!orbWindow || orbWindow.isDestroyed()) return;
  const { x, y } = screen.getCursorScreenPoint();
  orbWindow.setPosition(x - 30, y - 30); // Center 60x60 orb on cursor
}, 16); // ~60fps
```

**Performance**: Minimal CPU usage (<1%) due to lightweight window operations.

### Semantic Memory Auto-Storage

After the user receives an AI response, Ozen automatically extracts a key fact and stores it in Membrain:

1. Send query + answer to Ollama: "Extract one key fact to remember long-term"
2. Call `POST /api/v1/memories` with extracted fact
3. Poll job status until completion
4. Log success/failure

**User control**: Planned toggle to disable auto-memory in settings.

### State Persistence

`src/lib/store.ts` uses `localStorage` to persist:
- API keys (Ollama URL, Groq key, Membrain key)
- User preferences (default model, theme)
- Chat history (optional)

**Security note**: API keys are stored in plain localStorage in the web context. For desktop app, consider Electron's `safeStorage` API.

---

## External Dependencies

### Native Modules

- `uiohook-napi`: Global keyboard/mouse hooks (requires native compilation)
- `active-win`: Get active window info (requires native compilation)

**Build requirement**: Node.js native module toolchain (node-gyp, Visual Studio Build Tools on Windows).

### External Services

- **Ollama**: Must be running locally (`ollama serve`)
- **Membrain**: Cloud service or self-hosted (requires API key)
- **Groq**: Cloud AI API (optional, fallback only)

---

## Common Pitfalls

1. **Forgetting try-catch on IPC handlers** → App crashes on invalid input
2. **Not checking window state before operations** → Crashes when window destroyed
3. **Missing timeout on fetch** → Requests hang indefinitely
4. **Empty catch blocks** → Errors are swallowed, debugging is impossible
5. **Assuming Ollama is running** → Always handle connection errors gracefully
6. **Not validating user input** → Security risk in IPC communication

---

## Development Workflow

1. **Start Ollama**: `ollama serve` (or ensure it's running in background)
2. **Pull default model**: `ollama pull gemma3:1b`
3. **Set environment variables** in `ozen/.env`:
   ```
   MEMBRAIN_API_KEY=your_key_here
   MEMBRAIN_API_URL=https://api.membrain.im
   ```
4. **Install dependencies**: `npm install` in both `/ozen` and `/mcpa`
5. **Start dev server**: `npm run dev` (in `/ozen`)
6. **Test global hotkey**: Type `@ozen` in any text field
7. **Check console**: Watch for IPC messages, error logs, API responses

---

## Debugging Tips

- **Panel not spawning?** Check `uiohook-napi` is installed and native module compiled.
- **Ollama errors?** Verify `ollama serve` is running and model is pulled.
- **IPC not working?** Check `electron/preload.ts` exposes correct channels.
- **Window focus not returning?** Adjust delay in minimize-then-hide sequence.
- **Memory search fails?** Verify Membrain API key and endpoint in settings.

---

## Future Roadmap

(From `Docs/Roadmap.md`)

- Web search integration (parallel general/code/academic scouts)
- Voice input via speech recognition
- Memory visualization (force-directed graph with D3)
- Multi-user support (separate Membrain memory spaces)
- Plugin system for custom agents

---

## Resources

- **Full Architecture**: `Docs/Architecture.md`
- **Product Vision**: `Docs/ProductVision.md`
- **Error Handling Guide**: `ERROR_HANDLING_GUIDE.md`
- **Fix Summary**: `FIXES_SUMMARY.md`
- **Comprehensive Audit**: `AUDIT.md` (hackathon submission document)
