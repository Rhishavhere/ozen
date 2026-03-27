import { app, BrowserWindow, clipboard, screen, ipcMain, Tray, Menu, nativeImage, nativeTheme } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { uIOhook } from 'uiohook-napi'
import google from 'googlethis'
// @ts-ignore
import activeWindow from 'active-win'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'logo.svg'),
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true
    },
  })

  // Remove the application menu entirely
  win.setMenu(null);

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Window control IPCs for custom title bar
ipcMain.on('win-minimize', () => {
  try {
    if (win && !win.isDestroyed()) {
      win.minimize();
    }
  } catch (err) {
    console.error('Error minimizing window:', err);
  }
});

ipcMain.on('win-maximize', () => {
  try {
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  } catch (err) {
    console.error('Error maximizing/unmaximizing window:', err);
  }
});

ipcMain.on('win-close', () => {
  try {
    if (win && !win.isDestroyed()) {
      win.close();
    }
  } catch (err) {
    console.error('Error closing window:', err);
  }
});


let orbWin: BrowserWindow | null;
/** Auto-hide timeout for the orb window (5 s after showing). */
let orbTimeout: NodeJS.Timeout | null = null;
/** Module-scope tracking interval — lifted here so it can be cleared before restarting. */
let trackTimer: NodeJS.Timeout | null = null;
/** Separate timeout for the clipboard-triggered Shift+Enter activation window. */
let clipboardTimeout: NodeJS.Timeout | null = null;
let isOrbActiveDueToSelection = false;
let isShiftPressed = false;

// Clipboard tracking state
let lastClipboardText = '';

// function createOrbWindow() {
//   const size = 60; 
//   const point = screen.getCursorScreenPoint();
  
//   // Offset slightly down and to the right so it doesn't block the cursor or copied text
//   const targetX = Math.round(point.x + 15);
//   const targetY = Math.round(point.y + 15);

//   if (orbWin) {
//     // Use setBounds instead of setPosition (this is what the Panel uses, it's more reliable)
//     orbWin.setBounds({ x: targetX, y: targetY, width: size, height: size });
//     orbWin.showInactive();
//   } else {
//     orbWin = new BrowserWindow({
//       width: size,
//       height: size,
//       x: targetX,
//       y: targetY,
//       frame: false,
//       transparent: true,
//       alwaysOnTop: true,
//       skipTaskbar: true,
//       resizable: false,
//       focusable: false,
//       show: false, 
//       webPreferences: {
//         preload: path.join(__dirname, "preload.mjs")
//       }
//     });

//     orbWin.setIgnoreMouseEvents(true);

//     if (VITE_DEV_SERVER_URL) {
//       orbWin.loadURL(`${VITE_DEV_SERVER_URL}/#/orb`);
//     } else {
//       orbWin.loadFile(path.join(RENDERER_DIST, "index.html"), { hash: "/orb" });
//     }
    
//     // Wait until the renderer is ready before showing to eliminate initial flicker
//     orbWin.once('ready-to-show', () => {
//       if (orbWin && !orbWin.isDestroyed()) {
//         orbWin.showInactive();
//       }
//     });
//   }

//   // --- THE 60FPS TRACKING LOOP HAS BEEN DELETED ---

//   // Auto-hide after 5 seconds
//   if (orbTimeout) clearTimeout(orbTimeout);
//   orbTimeout = setTimeout(() => {
//     if (orbWin && !orbWin.isDestroyed()) {
//       orbWin.hide();
//       isOrbActiveDueToSelection = false;
//     }
//   }, 5000);
// }

function createOrbWindow() {
  const orbWidth = 120;   // room for the 80px slide-in animation + 32px orb
  const orbHeight = 60;

  const getPos = () => {
    const point = screen.getCursorScreenPoint();
    return {
      x: Math.round(point.x + 15),                        // just to the right of the cursor
      y: Math.round(point.y - Math.round(orbHeight / 2)),  // vertically centered with cursor
    };
  };

  const pos = getPos();

  if (orbWin) {
    orbWin.setBounds({ x: pos.x, y: pos.y, width: orbWidth, height: orbHeight });
    orbWin.showInactive();
  } else {
    orbWin = new BrowserWindow({
      width: orbWidth,
      height: orbHeight,
      x: pos.x,
      y: pos.y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.mjs")
      }
    });

    orbWin.setIgnoreMouseEvents(true);

    if (VITE_DEV_SERVER_URL) {
      orbWin.loadURL(`${VITE_DEV_SERVER_URL}/#/orb`);
    } else {
      orbWin.loadFile(path.join(RENDERER_DIST, "index.html"), { hash: "/orb" });
    }

    orbWin.once('ready-to-show', () => {
      if (orbWin && !orbWin.isDestroyed()) {
        orbWin.showInactive();
      }
    });
  }

  // Follow the cursor at 30fps using setBounds (smoother than setPosition on Windows)
  // Bug fix: clear any pre-existing tracking interval before starting a new one.
  if (trackTimer) { clearInterval(trackTimer); trackTimer = null; }
  trackTimer = setInterval(() => {
    if (orbWin && !orbWin.isDestroyed() && orbWin.isVisible()) {
      const p = getPos();
      orbWin.setBounds({ x: p.x, y: p.y, width: orbWidth, height: orbHeight });
    }
  }, 33);

  // Auto-hide after 5 seconds
  if (orbTimeout) clearTimeout(orbTimeout);
  orbTimeout = setTimeout(() => {
    if (trackTimer) { clearInterval(trackTimer); trackTimer = null; }
    if (orbWin && !orbWin.isDestroyed()) {
      orbWin.hide();
      isOrbActiveDueToSelection = false;
    }
  }, 5000);
}

async function copyAndQuery() {
  const { clipboard } = await import('electron');
  
  // The text is already in the clipboard, so we just read it directly
  const query = clipboard.readText();
  
  console.log('[Shift+Enter] Triggered copyAndQuery; clipboard text length:', query ? query.length : 0);
  
  const point = screen.getCursorScreenPoint();
  
  // Pass the query safely to the panel
  createPanelWindow(point.x, point.y + 10, query);

  // Reset the state so Shift+Enter goes back to normal immediately
  isOrbActiveDueToSelection = false;
  console.log('[Shift+Enter] Reset isOrbActiveDueToSelection to false');
  if (orbWin) {
    orbWin.hide();
  }
}
let panelWin: BrowserWindow | null;

function getClampedBounds(targetX: number, targetY: number, width: number, height: number, displayPoint: { x: number, y: number }) {
  const display = screen.getDisplayNearestPoint(displayPoint);
  const workArea = display.workArea;

  let x = targetX;
  let y = targetY;

  if (x < workArea.x) x = workArea.x + 10;
  if (x + width > workArea.x + workArea.width) x = (workArea.x + workArea.width) - width - 10;

  if (y < workArea.y) y = workArea.y + 10;
  if (y + height > workArea.y + workArea.height) y = (workArea.y + workArea.height) - height - 10;

  return { x, y, width, height };
}

async function fetchActiveWindow() {
  try {
    const win = await activeWindow();
    if (win) {
      return { title: win.title, owner: win.owner.name };
    }
  } catch (err) {
    console.error('Failed to get active window:', err);
  }
  return null;
}

async function createPanelWindow(x: number, y: number, query?: string) {
  const bounds = getClampedBounds(x - 200, y - 45, 420, 90, { x, y });

  const activeWin = await fetchActiveWindow();

  if (panelWin) {
    if (panelWin.isMinimized()) panelWin.restore();
    // Reset to collapsed size before positioning to prevent drift
    panelWin.setBounds(bounds);
    panelWin.setAlwaysOnTop(true, 'screen-saver', 1);
    panelWin.show();
    panelWin.focus();
    panelWin.webContents.focus();
    panelWin.webContents.send('panel-activated', activeWin);
    if (query) {
      panelWin.webContents.send('panel-query', query);
    }
    return;
  }

  panelWin = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
    },
  });

  panelWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  panelWin.setAlwaysOnTop(true, 'screen-saver', 1);

  if (VITE_DEV_SERVER_URL) {
    panelWin.loadURL(`${VITE_DEV_SERVER_URL}/#/panel`);
  } else {
    panelWin.loadFile(path.join(RENDERER_DIST, 'index.html'), { hash: '/panel' });
  }

  // Once the panel renderer is ready, grab focus aggressively
  panelWin.webContents.once('did-finish-load', () => {
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.focus();
      panelWin.webContents.focus();
      panelWin.webContents.send('panel-activated', activeWin);
      if (query) {
        panelWin.webContents.send('panel-query', query);
      }
    }
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createOrbWindow();
  }
});

ipcMain.on('hide-panel', () => {
  try {
    if (panelWin && !panelWin.isDestroyed()) {
      // Minimizing before hiding is the "gold standard" on Windows 
      // to force the OS to restore focus to the previously active application.
      panelWin.minimize();
      panelWin.hide();
    }
  } catch (err) {
    console.error('Error hiding panel:', err);
  }
});

ipcMain.on('clip-text', (_event, text: string) => {
  try {
    if (!text || typeof text !== 'string') {
      console.error('Invalid text provided to clip-text');
      return;
    }
    
    clipboard.writeText(text);
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.webContents.send('panel-reset');
      panelWin.minimize();
      panelWin.hide();
    }
    
    // Wait for focus to return to the previous window then paste
    setTimeout(() => {
      try {
        // Send 5 backspaces to remove '@ozen' then paste
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{BS}{BS}{BS}{BS}{BS}^v')`;
        const proc = spawn('powershell', ['-Command', psCommand]);
        proc.on('error', (err) => {
          console.error('Failed to execute paste command:', err);
        });
      } catch (err) {
        console.error('Error spawning powershell for paste:', err);
      }
    }, 200);
  } catch (err) {
    console.error('Error in clip-text handler:', err);
  }
});

ipcMain.on('open-in-desk', (_event, { url }) => {
  try {
    // Validate URL: must be a non-empty string
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided to open-in-desk (must be a non-empty string):', url);
      return;
    }

    // Allow about:blank as a safe blank page before full URL parsing
    if (url === 'about:blank') {
      // fall through to window logic below
    } else {
      // Parse and validate URL scheme to prevent loading dangerous protocols
      // (e.g. file:, javascript:, data:) via a potentially compromised renderer.
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch (parseErr) {
        console.error('Invalid URL provided to open-in-desk (failed to parse):', url, parseErr);
        return;
      }

      const allowedProtocols = new Set(['http:', 'https:']);
      if (!allowedProtocols.has(parsedUrl.protocol)) {
        console.error('Disallowed URL protocol in open-in-desk:', parsedUrl.protocol, 'for URL:', url);
        return;
      }
    }

    // If the Hub (main) window isn't open, create it
    if (!win || win.isDestroyed()) {
      createWindow();
    }

    // Once the window is ready, send the URL to open in the Browser tab
    const sendUrl = () => {
      if (win && !win.isDestroyed()) {
        win.show();
        win.focus();
        win.webContents.send('navigate-browser', { url });
      }
    };

    // If the window is still loading, wait for it
    if (win && !win.isDestroyed() && win.webContents.isLoading()) {
      win.webContents.once('did-finish-load', sendUrl);
    } else {
      sendUrl();
    }
  } catch (err) {
    console.error('Error in open-in-desk handler:', err);
  }
});

ipcMain.on('resize-panel', (_event, { width, height }) => {
  try {
    if (!panelWin || panelWin.isDestroyed()) {
      return;
    }

    if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
      console.error('Invalid dimensions for resize-panel:', { width, height });
      return;
    }

    const currentBounds = panelWin.getBounds();
    // Expand upwards! Keep the bottom edge (the input bar) matching where the cursor was
    const targetY = currentBounds.y + currentBounds.height - height;
    const bounds = getClampedBounds(currentBounds.x, targetY, width, height, { x: currentBounds.x, y: currentBounds.y });
    
    panelWin.setBounds(bounds, true); // true for animation if OS supports it
  } catch (err) {
    console.error('Error resizing panel:', err);
  }
});

ipcMain.handle('fetch-search-results', async (_event, query) => {
  try {
    if (!query || typeof query !== 'string') {
      return { error: 'Invalid query parameter' };
    }

    const images = await google.image(query, { safe: false });
    
    const resultsData = {
      imageUrls: images.slice(0, 3).map((img: any) => img.url)
    };
    console.log('Search Results for query:', query, resultsData);
    return resultsData;
  } catch (err: any) {
    console.error('Failed to fetch search results:', err);
    return { error: err.message || 'Failed to fetch search results' };
  }
});

let tray: Tray | null = null;

app.whenReady().then(() => {
  nativeTheme.themeSource = 'light';
  // Spawn ollama serve in background quietly
  try {
    const ollamaProcess = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore', windowsHide: true });
    ollamaProcess.on('error', (err) => {
      console.error('Failed to spawn ollama process:', err);
    });
    ollamaProcess.unref();
  } catch (e) {
    console.error('Failed to start ollama background service:', e);
    // App continues but Ollama features will be unavailable
  }

  createOrbWindow(); // Now opens the Orb instead of the Main window on launch

  // Create System Tray Icon — use PNG since Windows can't render SVG in tray
  const iconPath = path.join(process.env.VITE_PUBLIC, "logo.png");
  let trayIcon = nativeImage.createFromPath(iconPath);
  if (!trayIcon.isEmpty()) {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } else {
    // Bug fix: guard against missing/invalid icon to prevent crash at startup.
    console.warn('[Tray] logo.png not found or empty at:', iconPath, '– using empty fallback icon');
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open Ozen Hub", click: () => { createWindow() } },
    { type: "separator" },
    { label: "Quit Ozen", click: () => { app.quit() } }
  ]);
  tray.setToolTip("Ozen");
  tray.setContextMenu(contextMenu);

  // Track key sequence for "@ozen"
  // Assuming keys: 2 (usually has @), o, z, e, n
  // UiohookKey: 2 = 3, O = 24, Z = 44, E = 18, N = 49
  let buffer: number[] = [];
  const TARGET = [3, 24, 44, 18, 49]; 
  const IGNORED_KEYS = [42, 54, 29, 3613, 56, 3640, 3675, 3676]; // Shift, Ctrl, Alt, Meta
  
  uIOhook.on("keydown", (e) => {
    try {
      if (e.keycode === 42 || e.keycode === 54) {
        isShiftPressed = true;
        console.log('[Shift+Enter] Shift key pressed (keycode:', e.keycode, ')');
      }
      if (IGNORED_KEYS.includes(e.keycode)) return;

      // Handle Shift+Enter when Orb is active due to selection
      // Enter: 28
      if (e.keycode === 28 && (isShiftPressed || e.shiftKey)) {
        console.log('[Shift+Enter] Enter pressed with Shift. isOrbActiveDueToSelection:', isOrbActiveDueToSelection);
        if (isOrbActiveDueToSelection) {
          copyAndQuery();
          return;
        } else {
          console.log('[Shift+Enter] Ignored - no active selection detected');
        }
      }

      // Handle Shift+Space to summon the panel instantly
      // Space: 57
      if (e.keycode === 57 && (isShiftPressed || e.shiftKey)) {
        const point = screen.getCursorScreenPoint();
        createPanelWindow(point.x, point.y + 20);
        return;
      }

      buffer.push(e.keycode);
      if (buffer.length > 5) buffer.shift();
      
      if (buffer.length === 5) {
        const isTarget = buffer.every((val, index) => val === TARGET[index]);
        if (isTarget) {
          buffer = []; // Clear buffer
          const point = screen.getCursorScreenPoint();
          createPanelWindow(point.x, point.y + 20);
        }
      }
    } catch (err) {
      console.error('Error in keydown handler:', err);
    }
  });

  uIOhook.on("keyup", (e) => {
    if (e.keycode === 42 || e.keycode === 54) {
      isShiftPressed = false;
      console.log('[Shift+Enter] Shift key released (keycode:', e.keycode, ')');
    }
  });

// Initialize baseline clipboard state
  lastClipboardText = clipboard.readText();
  console.log('[Shift+Enter] Initialized clipboard tracking. Current text length:', lastClipboardText?.length || 0);

  // Poll clipboard every 100ms for new text (reduced from 500ms for better responsiveness)
  setInterval(() => {
    try {
      const currentText = clipboard.readText();
      
      if (currentText && currentText.trim() !== '' && currentText !== lastClipboardText) {
        lastClipboardText = currentText;
        isOrbActiveDueToSelection = true;
        console.log('[Shift+Enter] NEW CLIPBOARD TEXT DETECTED! Length:', currentText.length, '(content not logged)');
        console.log('[Shift+Enter] isOrbActiveDueToSelection set to TRUE. You have 10 seconds to press Shift+Enter.');
        
        // We removed createOrbWindow() here so it stays completely silent!

        // Keep the 10-second active window for the Shift+Enter hotkey (increased from 5s)
        // Bug fix: use clipboardTimeout (not orbTimeout) so orb auto-hide isn't cancelled.
        if (clipboardTimeout) clearTimeout(clipboardTimeout);
        clipboardTimeout = setTimeout(() => {
          isOrbActiveDueToSelection = false;
          console.log('[Shift+Enter] 10-second timeout expired. isOrbActiveDueToSelection set to FALSE.');
        }, 10000);
      }
    } catch (err) {
      console.error('Error reading clipboard:', err);
    }
  }, 100);

  uIOhook.start();
})

app.on('before-quit', () => {
  uIOhook.stop();
})
