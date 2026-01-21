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