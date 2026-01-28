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
  noCommit?: boolean; // Stage changes without committing
  strategy?: 'recursive' | 'resolve' | 'ours' | 'theirs';
  squash?: boolean; // Squash multiple commits into one
}

export interface CherryPickResult {
  success: boolean;
  conflicts: string[]; // File paths with conflicts
  appliedCommits: string[]; // Successfully applied commit hashes
  totalCommits?: number; // Total commits being processed
  currentCommit?: string; // Currently processing commit hash
  progress?: number; // Progress as percentage (0-100)
  errorMessage?: string; // Detailed error message
  errorType?: 'conflict' | 'branch_error' | 'git_error' | 'permission_error' | 'unknown'; // Type of error
}