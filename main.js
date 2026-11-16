'use strict';

/**
 * Graph Studio - Windows shell.
 *
 * The app itself is the same single HTML page used in the Android APK (app/index.html, not modified).
 * This file only provides the window around it: a phone-shaped resizable window, no menu bar, no network,
 * and the small "AndroidTheme" bridge the page expects (see preload.js).
 */

const { app, BrowserWindow, Menu, nativeTheme, ipcMain, screen, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const PAGE = path.join(__dirname, 'app', 'index.html');
const ICON = path.join(__dirname, 'build', 'icon.png');
const DARK_BG = '#000000';
const LIGHT_BG = '#f2f2f7';

let win = null;

// Only one copy of the app at a time: opening it again just brings the existing window to the front.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(start);
  app.on('window-all-closed', () => app.quit());
}

// ---------------------------------------------------------------- window size memory

function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    if (s && Number.isFinite(s.width) && Number.isFinite(s.height)) return s;
  } catch (_) { /* first run */ }
  return null;
}

function saveState() {
  try {
    if (!win || win.isDestroyed()) return;
    const maximized = win.isMaximized();
    const b = maximized ? (win.getNormalBounds ? win.getNormalBounds() : win.getBounds()) : win.getContentBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({
      x: b.x, y: b.y, width: b.width, height: b.height, maximized,
    }));
  } catch (_) { /* never block closing because of this */ }
}

/** Is the remembered position still on a connected screen? (a monitor may have been unplugged) */
function isVisible(s) {
  if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) return false;
  return screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return s.x + 80 < a.x + a.width && s.x + s.width - 80 > a.x && s.y >= a.y - 10 && s.y + 60 < a.y + a.height;
  });
}

function defaultSize() {
  const area = screen.getPrimaryDisplay().workArea;
  const height = Math.max(600, Math.min(860, area.height - 90));
  const width = Math.max(380, Math.min(460, Math.round(height * 0.52)));
  return { width, height };
}

// ---------------------------------------------------------------- start

function start() {
  Menu.setApplicationMenu(null);                       // no File / Edit / View bar - the app looks like the phone app

  // The app is fully offline: refuse every permission request and every network navigation.
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));

  const saved = loadState();
  const size = saved ? { width: saved.width, height: saved.height } : defaultSize();
  const opts = {
    width: size.width,
    height: size.height,
    useContentSize: true,
    minWidth: 360,
    minHeight: 560,
    show: false,                                       // shown when the first frame is ready (no white flash)
    backgroundColor: DARK_BG,
    title: 'Graph Studio',
    icon: ICON,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  };
  if (saved && isVisible(saved)) { opts.x = saved.x; opts.y = saved.y; }

  win = new BrowserWindow(opts);
  if (saved && saved.maximized) win.maximize();

  const wc = win.webContents;
  try { const p = wc.setVisualZoomLevelLimits(1, 1); if (p && p.catch) p.catch(() => {}); } catch (_) { } // no pinch zoom, like the phone app

  // Nothing may navigate away from the app page, and no extra windows may open.
  wc.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) e.preventDefault(); });
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));

  // F11 = full screen.   Ctrl+Shift+I = developer tools (only needed if something ever goes wrong).
  wc.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    } else if (input.control && input.shift && String(input.key).toLowerCase() === 'i') {
      wc.toggleDevTools();
      e.preventDefault();
    }
  });

  // If the page ever fails to load or its renderer dies, say why instead of leaving a blank window.
  wc.on('did-fail-load', (_e, code, desc, url) => {
    dialog.showErrorBox('Graph Studio', `The page could not be loaded.\n\n${desc} (${code})\n${url}`);
  });
  wc.on('render-process-gone', (_e, details) => {
    dialog.showErrorBox('Graph Studio', `The page stopped working (${details.reason}). The app will reload.`);
    wc.reload();
  });

  win.once('ready-to-show', () => win.show());
  win.on('close', saveState);
  win.on('closed', () => { win = null; });

  win.loadFile(PAGE);
}

// ---------------------------------------------------------------- bridge used by the page (see preload.js)

function hex(rgb) {
  return '#' + ((rgb >>> 0) & 0xFFFFFF).toString(16).padStart(6, '0');
}

// The page tells us when the day / night theme changes: match the title bar and the window background.
ipcMain.on('gs:light', (_e, light) => {
  nativeTheme.themeSource = light ? 'light' : 'dark';
  if (win && !win.isDestroyed()) win.setBackgroundColor(light ? LIGHT_BG : DARK_BG);
});

// setBars(statusRgb, navRgb): on the phone these colour the status / navigation bars; here the window background.
ipcMain.on('gs:bars', (_e, statusRgb) => {
  if (win && !win.isDestroyed() && Number.isFinite(statusRgb)) win.setBackgroundColor(hex(statusRgb));
});
