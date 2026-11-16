'use strict';

/**
 * The page was written for the Android shell, which gives it an object called "AndroidTheme"
 * (setLightMode, setBars, getInsetBottom). This file offers the same object on Windows so the page needs no change.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('AndroidTheme', {
  // Day / night switch: true = light theme.
  setLightMode: (light) => ipcRenderer.send('gs:light', !!light),

  // Colours for the status bar / navigation bar on a phone; on Windows only the window background follows.
  setBars: (statusRgb, navRgb) => ipcRenderer.send('gs:bars', Number(statusRgb) | 0, Number(navRgb) | 0),

  // A PC has no navigation bar at the bottom, so the page needs no extra space there.
  getInsetBottom: () => 0,
});
