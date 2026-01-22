import { contextBridge, ipcRenderer } from 'electron';
import { GetCommitsOptions, CherryPickOptions } from './types';

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
       getCommits: (options?: GetCommitsOptions) => ipcRenderer.invoke('git:getCommits', options),
       cherryPickCommits: (commitHashes: string[], targetBranch: string, options?: CherryPickOptions) => ipcRenderer.invoke('git:cherryPickCommits', commitHashes, targetBranch, options),
       push: () => ipcRenderer.invoke('git:push'),
       pull: () => ipcRenderer.invoke('git:pull'),
       getDiff: (staged?: boolean) => ipcRenderer.invoke('git:getDiff', staged),
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

  // Config operations
  config: {
    load: () => ipcRenderer.invoke('config:load'),
    save: (config: { scanPaths: string[] }) => ipcRenderer.invoke('config:save', config),
  },
});