# Implementation Roadmap

## ✅ Phase 1: The Magic Trigger
- [x] Implement global key listener using `uiohook-napi`.
- [x] Detect `ozen` sequence in the background (rolling 5-key buffer).
- [x] Spawn Panel at the current cursor position on detection.

## ✅ Phase 2: The Floating Panel
- [x] Frameless, transparent "at-cursor" Electron window.
- [x] Auto-focus input field on every summon.
- [x] `Esc` or close button to dismiss.
- [x] Windows focus restoration ("minimize-then-hide") to snap focus back to previous app.
- [x] Always-on-top (`screen-saver` level) — visible above all apps and virtual desktops.
- [x] Precision cursor positioning with height reset to prevent drift on re-summon.

## ✅ Phase 3: The Floating Orb (Status Indicator)
- [x] Always-on-top transparent circular window with custom SVG logo.
- [x] Click-through (`setIgnoreMouseEvents`) — never blocks user interactions.
- [x] Cursor-tracking at ~60fps using setInterval in the Main Process.
- [x] Framer Motion "zoop" spring entrance animation.
- [x] Auto-hides after 5 seconds.
- [x] System Tray integration — Ozen runs purely as a background process.
- [x] Tray context menu: "Open Ozen Hub" and "Quit Ozen".

## ✅ Phase 4: AI Panel Integration
- [x] Ollama auto-serve on startup via `child_process.spawn`.
- [x] Model pinned to `gemma3:1b`.
- [x] Panel expands "upwards" into a chat window on first query using `resize-panel` IPC.
- [x] Streaming responses via `useOllama` hook.
- [x] Two-module floating UI: separate rounded chat bubble and input bar.
- [x] Dynamic 3-state placeholder text in the input.
- [x] Minimal inset scrollbar in the chat area.
- [x] State resets (messages, input, size) after panel is dismissed.

## 🔲 Phase 5: The Hub (Main Power Interface)
- [ ] Design and build the main Electron window for management.
- [ ] Chat history persistence.
- [ ] User settings (model selection, keybind customization).
- [ ] "Extend to Hub" action from the floating Panel.

## 🔲 Phase 6: Web & Agentic Workflows
- [ ] Implement `BrowserView` inside the Panel for live web search results.
- [ ] Add basic web scraping to feed browser content into AI context.
- [ ] Allow users to define custom agents and workflow steps.
- [ ] System-level command integration (open app, move file).

