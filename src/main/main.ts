import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { GitService } from './gitService';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const isDev = process.env.NODE_ENV === 'development';
const gitService = new GitService();

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0] || null;
});

// Git operation handlers
ipcMain.handle('git:getStatus', async () => {
  return await gitService.getStatus();
});

ipcMain.handle('git:initRepository', async (_, repoPath: string) => {
  return await gitService.initRepository(repoPath);
});

ipcMain.handle('git:addFiles', async (_, files: string[]) => {
  return await gitService.addFiles(files);
});

ipcMain.handle('git:commit', async (_, message: string) => {
  return await gitService.commit(message);
});

ipcMain.handle('git:getBranches', async () => {
  return await gitService.getBranches();
});

ipcMain.handle('git:createBranch', async (_, name: string) => {
  return await gitService.createBranch(name);
});

ipcMain.handle('git:checkoutBranch', async (_, name: string) => {
  return await gitService.checkoutBranch(name);
});

ipcMain.handle('git:mergeBranch', async (_, sourceBranch: string) => {
  return await gitService.mergeBranch(sourceBranch);
});

ipcMain.handle('git:rebaseBranch', async (_, targetBranch: string) => {
  return await gitService.rebaseBranch(targetBranch);
});

// Repository management handlers
ipcMain.handle('repositories:discover', async () => {
  return await gitService.discoverRepositories();
});

ipcMain.handle('repositories:open', async (_, repoPath: string) => {
  return await gitService.openRepository(repoPath);
});

ipcMain.handle('repositories:getCurrent', async () => {
  return await gitService.getCurrentRepository();
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});