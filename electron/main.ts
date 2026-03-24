import { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, nativeTheme } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { uIOhook } from 'uiohook-napi'

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
ipcMain.on('win-minimize', () => { win?.minimize(); });
ipcMain.on('win-maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});
ipcMain.on('win-close', () => { win?.close(); });


let orbWin: BrowserWindow | null;
let orbTimeout: NodeJS.Timeout;
let trackInterval: NodeJS.Timeout | null = null;

function createOrbWindow() {
  const size = 60; // Larger window to allow the "zoop" animation space to breathe without clipping
  
  const getPosition = () => {
    const point = screen.getCursorScreenPoint();
    return { x: point.x, y: point.y };
  };

  const initialPos = getPosition();

  if (orbWin) {
    orbWin.setPosition(initialPos.x, initialPos.y);
    orbWin.show();
  } else {
    orbWin = new BrowserWindow({
      width: size,
      height: size,
      x: initialPos.x,
      y: initialPos.y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
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
  }

  // Active tracking loop while visible
  if (trackInterval) clearInterval(trackInterval);
  trackInterval = setInterval(() => {
    if (orbWin && !orbWin.isDestroyed() && orbWin.isVisible()) {
      const pos = getPosition();
      orbWin.setPosition(pos.x, pos.y);
    }
  }, 16); // ~60fps tracking

  // Auto-hide after 5 seconds
  if (orbTimeout) clearTimeout(orbTimeout);
  orbTimeout = setTimeout(() => {
    if (orbWin && !orbWin.isDestroyed()) {
      orbWin.hide();
      if (trackInterval) {
        clearInterval(trackInterval);
        trackInterval = null;
      }
    }
  }, 5000);
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

function createPanelWindow(x: number, y: number) {
  const bounds = getClampedBounds(x - 300, y - 40, 400, 60, { x, y });

  if (panelWin) {
    if (panelWin.isMinimized()) panelWin.restore();
    // Reset to collapsed size before positioning to prevent drift
    panelWin.setBounds(bounds);
    panelWin.setAlwaysOnTop(true, 'screen-saver', 1);
    panelWin.show();
    panelWin.focus();
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
  if (panelWin) {
    // Minimizing before hiding is the "gold standard" on Windows 
    // to force the OS to restore focus to the previously active application.
    panelWin.minimize();
    panelWin.hide();
  }
});

ipcMain.on('open-in-desk', (_event, { url }) => {
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
});

ipcMain.on('resize-panel', (_event, { width, height }) => {
  if (panelWin) {
    const currentBounds = panelWin.getBounds();
    // Expand upwards! Keep the bottom edge (the input bar) matching where the cursor was
    const targetY = currentBounds.y + currentBounds.height - height;
    const bounds = getClampedBounds(currentBounds.x, targetY, width, height, { x: currentBounds.x, y: currentBounds.y });
    
    panelWin.setBounds(bounds, true); // true for animation if OS supports it
  }
});

let tray: Tray | null = null;

app.whenReady().then(() => {
  nativeTheme.themeSource = 'light';
  // Spawn ollama serve in background quietly
  try {
    const ollamaProcess = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore', windowsHide: true });
    ollamaProcess.unref();
  } catch (e) {
    console.error('Failed to start ollama background service:', e);
  }

  createOrbWindow(); // Now opens the Orb instead of the Main window on launch

  // Create System Tray (Background Apps) Icon
  const iconPath = path.join(process.env.VITE_PUBLIC, "logo.svg");
  tray = new Tray(nativeImage.createFromPath(iconPath));
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
    if (IGNORED_KEYS.includes(e.keycode)) return;

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
  });

  uIOhook.start();
})

app.on('before-quit', () => {
  uIOhook.stop();
})
