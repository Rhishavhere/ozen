# Technical Challenges & Solutions

## 1. Global Caret (Cursor) Tracking
**Problem**: Windows doesn't make it easy to get the screen coordinates of a text caret in third-party apps (Chrome, VS Code, Word).
**Solutions**:
- **UI Automation (UIA)**: Iterating through accessible elements to find `FocusedElement` and its `BoundingRectangle`.
- **Win32 API**: `GetGUIThreadInfo` (though less reliable in modern apps).

## 2. Global Input Hooking
**Problem**: Detecting `@ozen` without interfering with normal typing speed (debounce/buffer logic).
**Solutions**:
- **Global Key Hooks**: Using libraries like `iohook` or `uiohook-napi`.
- **Buffer Logic**: Keep a rolling buffer of 5 characters. If suffix matches `@ozen`, delete the `@ozen` text (via Backspace simulation) and trigger the UI.

## 3. Webview Performance
**Problem**: Running a browser *inside* an AI app can be memory intensive.
**Solutions**:
- **BrowserView Management**: Only spawn the browser when a web-related query is detected or requested.
- **Shared Memory**: Use Electron IPC for fast data transfer between AI and Web contexts.

## 4. Multi-model Management
**Problem**: Switching models on the fly in Ollama can be slow if the model isn't pre-loaded.
**Solutions**:
- **Precaching**: Suggesting models that are already loaded in memory.
- **Ollama Control**: API-level management to keep preferred models warm.
