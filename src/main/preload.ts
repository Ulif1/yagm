import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Git operations will be exposed here
  git: {
    getStatus: () => ipcRenderer.invoke('git:getStatus'),
    initRepository: (path: string) => ipcRenderer.invoke('git:initRepository', path),
    addFiles: (files: string[]) => ipcRenderer.invoke('git:addFiles', files),
    commit: (message: string) => ipcRenderer.invoke('git:commit', message),
    getBranches: () => ipcRenderer.invoke('git:getBranches'),
    createBranch: (name: string) => ipcRenderer.invoke('git:createBranch', name),
      checkoutBranch: (name: string) => ipcRenderer.invoke('git:checkoutBranch', name),
      mergeBranch: (sourceBranch: string) => ipcRenderer.invoke('git:mergeBranch', sourceBranch),
      rebaseBranch: (targetBranch: string) => ipcRenderer.invoke('git:rebaseBranch', targetBranch),
  },

  // Repository management
  repositories: {
    discover: () => ipcRenderer.invoke('repositories:discover'),
    open: (path: string) => ipcRenderer.invoke('repositories:open', path),
    getCurrent: () => ipcRenderer.invoke('repositories:getCurrent'),
  },

  // Dialog operations
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  },
});