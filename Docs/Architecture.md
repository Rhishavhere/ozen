# System Architecture: Ozen

## Overview
Ozen is built on **Electron** with a **Vite/React** renderer, leveraging its multi-window capabilities to run as a near-invisible OS-level AI companion. There are three concurrent windows managed by the Main Process.

---

## Windows

### 1. The Orb (Startup Window)
- **Type**: Frameless, fully transparent, `60x60px`, always-on-top, click-through.
- **Purpose**: Status indicator. Appears at the cursor on launch and auto-hides after 5s.
- **Motion**: Tracks the cursor at ~60fps via `setInterval` in the Main Process.
- **Interaction**: `setIgnoreMouseEvents(true)` — completely non-interactive.
- **Route**: `/#/orb`

### 2. The Panel (AI Chat Window)
- **Type**: Frameless, fully transparent, always-on-top (`'screen-saver'` level).
- **Default Size**: `400 x 60px` (collapsed input bar).
- **Expanded Size**: `400 x 400px` (chat window + input bar).
- **Purpose**: Primary user-facing interface for AI interaction. Spawned at cursor position.
- **Focus**: Steals focus on show, returns focus to the previous app via `minimize()`-then-`hide()` on `Esc`.
- **Route**: `/#/panel`

### 3. The Hub (Main App)
- **Type**: Standard framed Electron window.
- **Purpose**: Future power interface (history, settings, agents). Accessible from the Tray.
- **Route**: `/` (default)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Electron |
| Frontend | React (Vite), TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| Global Input Hook | `uiohook-napi` |
| Local AI Inference | Ollama (`gemma3:1b`) |
| IPC | Electron `ipcMain` / `ipcRenderer` (preload bridge) |

---

## IPC Message Flow

```
User types "ozen"
  → uiohook keydown buffer matches
  → Main: getCursorScreenPoint()
  → Main: createPanelWindow(x, y)
  → Panel shown at cursor, focus stolen

User submits query
  → Panel: ipcRenderer.send('resize-panel', {w:400, h:400})
  → Main: panelWin.setBounds(...) [expand upward]
  → Panel: fetch streaming response from Ollama API (localhost:11434)
  → Panel: renders chunks in real-time

User presses Esc
  → Panel: ipcRenderer.send('hide-panel')
  → Main: panelWin.minimize() → panelWin.hide()
  → OS: focus returned to previous application
  → Panel: state reset (messages, input, size) after 300ms
```

