# Implementation Roadmap

## Phase 1: Prototype "The Trigger"
- [ ] Implement global key listener using `uiohook-napi`.
- [ ] Detect `@ozen` sequence in the background.
- [ ] Implement text deletion (backspace injection) upon detection.

## Phase 2: The Positioning
- [ ] Research and implement the most robust Caret Tracking for Windows.
- [ ] Create a frameless "Mini-App" window that pops up at specified coordinates.

## Phase 3: The Floating Orb (Status & Toggle)
- [ ] Create an "Always-on-Top" small window with high-quality icons.
- [ ] Implement global state management in the Main Process to sync the Orb state with the Trigger Listener.
- [ ] Implement drag-and-drop support for the Orb to allow users to reposition it.

## Phase 4: AI + Web Hybrid
- [ ] Integrate the existing Ollama chat logic into the Mini-App.
- [ ] Implement `BrowserView` inside the Panel to display search results.
- [ ] Add basic "Web Scraping" to feed the browser content back into the AI context.

## Phase 4: The Hub (The Power Interface)
- [ ] Design and build the main Electron window for management.
- [ ] Implement persistence for chat history and settings.

## Phase 5: Agentic Workflows
- [ ] Allow users to define custom agents and browsing steps.
- [ ] Integrate with system-level commands (open app, move file).
