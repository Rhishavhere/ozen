# Ozen: Product Vision & Philosophy

## The Problem
There is a cognitive gap between "Action" and "Knowledge." When a user needs AI help, they must:
1. Break their flow — leave VS Code, Notepad, the browser.
2. Open a separate app or tab.
3. Type the query.
4. Copy-paste the result back.

**Ozen kills this gap.**

## The Vision
Ozen is a **near-invisible OS layer**. It doesn't want you to come to it — it appears exactly where you are, when you summon it by typing `ozen`.

## Core Experience Pillars
1. **Contextual Presence**: The panel spawns at your cursor. Zero window-switching.
2. **Zero Friction Dismissal**: `Esc` closes the panel *and* returns focus to your original textbox instantly. Type `Esc` → continue writing. No clicks needed.
3. **The Orb**: A small, ambient floating icon that appears on launch and auto-fades. Purely a status signal — never intrusive.
4. **Local-first Intelligence**: Powered by Ollama running on your machine. Private, fast, offline-capable.
5. **Fluidity**: A tiny input bar that expands into a full chat module on demand, then collapses back. Feels native to the OS.

## Current State (V1 — AI Panel)
- Typing `ozen` anywhere summons the floating Panel at the cursor.
- The Panel connects to the local `gemma3:1b` model via Ollama.
- Queries stream responses in real-time into an expanding chat view.
- Dismiss with `Esc` to return immediately to your previous context.

## Upcoming (V2 — The Hub + Web)
- **Web Companion**: AI summary + live search results side-by-side in the Panel.
- **The Hub**: A full main-window experience for chat history, agent configuration, and settings.
- **Agentic Actions**: Let Ozen execute system commands and multi-step workflows.

