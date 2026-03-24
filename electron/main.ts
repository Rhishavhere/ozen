import { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } from 'electron'
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
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

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

function createPanelWindow(x: number, y: number) {
  if (panelWin) {
    panelWin.setPosition(x, y);
    panelWin.show();
    panelWin.focus();
    return;
  }

  panelWin = new BrowserWindow({
    width: 400,
    height: 80,
    x: Math.max(0, x - 300), // center roughly around cursor
    y: Math.max(0, y - 40),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

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
    panelWin.blur(); // Blur first to encourage OS to return focus to previous app
    panelWin.hide();
  }
});

ipcMain.on('resize-panel', (_event, { width, height }) => {
  if (panelWin) {
    const currentBounds = panelWin.getBounds();
    // Expand upwards! Keep the bottom edge (the input bar) matching where the cursor was
    const newY = currentBounds.y + currentBounds.height - height;
    panelWin.setBounds({ 
      x: currentBounds.x, 
      y: newY, 
      width: width, 
      height: height 
    }, true); // true for animation if OS supports it
  }
});

let tray: Tray | null = null;

app.whenReady().then(() => {
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
