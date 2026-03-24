# System Architecture: Ozen

## Architecture Overview
Ozen is built on **Electron**, leveraging its multi-window capabilities to provide two distinct experiences: **The Panel** and **The Hub**.

### 1. The Listener (Main Process)
- **Global Input Hook**: Low-level OS hook to detect the `@ozen` string.
- **Caret Tracking**: Interfacing with Accessibility APIs (UIA on Windows) to determine the exact (X, Y) coordinates of the text cursor.
- **Process Management**: Managing the lifecycle of Ollama and browser instances.

### 2. The Panel (Floating Window)
- **Frameless & Transparent**: Designed to look like a floating Raycast-style UI.
- **Webview/BrowserView**: A sandboxed instance of a browser for web search results.
- **AI View**: A React-based chat interface connected to the Ollama local API.

### 3. The Orb (Overlay Window)
- **Always-on-Top**: Small circular/square window (e.g., 40x40px).
- **Interactivity**: 
    - **Left Click**: Toggle State A (Active) <-> State B (Inactive).
    - **Right Click**: Context menu for Settings, Hub, and Quit.
- **Visual Feedback**: Changes logo/color based on the "Active" state.

### 4. The Hub (Main Application Window)
- **Dashboard**: History of actions, custom agents, and saved workflows.
- **Full Browser Experience**: A side-by-side view of a browser and an AI agent for heavy knowledge work.

## Technology Stack
- **Frontend**: React + Tailwind CSS + Lucide Icons.
- **Runtime**: Electron.
- **Native Integration**: `node-abi`, `uiohook` (or custom C++) for global input detection.
- **Web Content**: Electron `BrowserView` (preferred over webview for performance).
- **Inference**: Ollama (Local API).

## Communication Flow
1. **User Types `@ozen`** -> Main Process detects sequence.
2. **Main Process** -> Requests Caret Position via UI Automation.
3. **Main Process** -> Spawns/Positions "Panel Window" at (X, Y).
4. **User Queries** -> Panel sends query to Main Process.
5. **Main Process** -> Concurrent requests to Ollama API and Web Search (Scraper/Search API).
6. **Panel** -> Renders results in real-time.
