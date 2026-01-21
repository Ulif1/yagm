// Git status types
export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

// Repository types
export interface Repository {
  path: string;
  name: string;
  currentBranch?: string;
  status?: GitStatus;
}

// Electron API types (matching preload script)
declare global {
  interface Window {
    electronAPI: {
      git: {
        getStatus: () => Promise<GitStatus>;
        initRepository: (path: string) => Promise<boolean>;
        addFiles: (files: string[]) => Promise<boolean>;
        commit: (message: string) => Promise<boolean>;
        getBranches: () => Promise<string[]>;
        createBranch: (name: string) => Promise<boolean>;
        checkoutBranch: (name: string) => Promise<boolean>;
        mergeBranch: (sourceBranch: string) => Promise<boolean>;
        rebaseBranch: (targetBranch: string) => Promise<boolean>;
      };
      repositories: {
        discover: () => Promise<Repository[]>;
        open: (path: string) => Promise<boolean>;
        getCurrent: () => Promise<Repository | null>;
      };
      dialog: {
        openDirectory: () => Promise<string | null>;
      };
    };
  }
}

export {};