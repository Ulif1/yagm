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

// Commit types
export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  branch?: string;
}

export interface DiffFile {
  filename: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface CommitDiff {
  files: DiffFile[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface CommitWithDiff extends Commit {
  diff: CommitDiff;
}

export interface GetCommitsOptions {
  limit?: number;
  skip?: number;
  branch?: string;
  messageFilter?: string;
  includeDiffs?: boolean;
}

export interface CherryPickOptions {
  noCommit?: boolean;
  strategy?: 'recursive' | 'resolve' | 'ours' | 'theirs';
  squash?: boolean;
}

export interface CherryPickResult {
  success: boolean;
  conflicts: string[];
  appliedCommits: string[];
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
        getCommits: (options?: GetCommitsOptions) => Promise<CommitWithDiff[]>;
        cherryPickCommits: (commitHashes: string[], targetBranch: string, options?: CherryPickOptions) => Promise<CherryPickResult>;
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