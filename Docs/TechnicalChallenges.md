# Technical Challenges & Solutions

## ✅ Solved: Global Input Hooking
**Problem**: Detecting the `ozen` keyword in any application without interfering with normal typing.
**Solution**: `uiohook-napi` for a cross-process, low-level keyboard event listener. A rolling 5-key buffer compares keycode sequences. Modifier keys (Shift, Ctrl, Alt, Meta) are filtered out to prevent false negatives.

---

## ✅ Solved: Windows Focus Restoration
**Problem**: After hiding a floating `alwaysOnTop` Electron window, Windows does not automatically return focus to the previously active application. The user had to click their original textbox again.
**Solution**: Call `panelWin.minimize()` *before* `panelWin.hide()`. Minimizing is a stronger OS signal — Windows treats it as a true "window gone" event and correctly restores focus to the Z-order's next window. This is the "Gold Standard" approach for floating utility apps on Windows 10/11.

---

## ✅ Solved: Panel Position Drift on Re-summon
**Problem**: If the Panel was dismissed while in its "expanded" state (400px tall), its stored bounds were 400px. The next summon would use this height during position calculation, causing the input bar to appear far below the cursor.
**Solution**: In `createPanelWindow`, when the window already exists, we call `setBounds({ ..., height: 60 })` to force a reset to the collapsed size *before* computing the new cursor-relative coordinates.

---

## ✅ Solved: Scrollbar Clipping Through Rounded Corners
**Problem**: The `overflow-y: auto` scrollbar on the chat area was rendering outside the `border-radius`, creating a sharp visual glitch.
**Solution**: Added an inner wrapper `div` with `overflow-y-auto` inside the outer container that has `overflow: hidden`. This ensures the scrollbar is clipped by the parent's border-radius. The scrollbar thumb also uses `background-clip: content-box` with a transparent border to create an inset, floating appearance.

---

## 🔲 Upcoming: Global Caret (Cursor) Tracking
**Problem**: The Panel currently positions itself relative to the mouse cursor, not the text caret. For text-editing contexts (VS Code, Word), ideally the panel should appear right below the typed word.
**Potential Solution**: Windows UI Automation API (`IUIAutomation`) via a native Node.js addon or a PowerShell IPC bridge to query `FocusedElement.BoundingRectangle`. This requires a compiled native module.

---

## 🔲 Upcoming: Webview Performance
**Problem**: Embedding a live browser inside the Panel for web search results is memory-intensive.
**Potential Solution**: Use Electron's `BrowserView` (not `<webview>`) and only spawn it on-demand when a web-search query is detected.

