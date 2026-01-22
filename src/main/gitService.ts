import simpleGit, { SimpleGit, StatusResult, LogResult } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
import { GitStatus, Repository, CommitWithDiff, GetCommitsOptions, CherryPickOptions, CherryPickResult, DiffFile, CommitDiff } from './types';

export class GitService {
  private git: SimpleGit | null = null;
  private currentPath: string | null = null;

  /**
   * Open a git repository at the specified path
   */
  async openRepository(repoPath: string): Promise<boolean> {
    try {
      // Check if it's a git repository
      const isGitRepo = await this.isGitRepository(repoPath);
      if (!isGitRepo) {
        return false;
      }

      this.git = simpleGit(repoPath);
      this.currentPath = repoPath;
      return true;
    } catch (error) {
      console.error('Failed to open repository:', error);
      this.git = null;
      this.currentPath = null;
      return false;
    }
  }

  /**
   * Initialize a new git repository at the specified path
   */
  async initRepository(repoPath: string): Promise<boolean> {
    try {
      this.git = simpleGit(repoPath);
      await this.git.init();
      this.currentPath = repoPath;
      return true;
    } catch (error) {
      console.error('Failed to initialize repository:', error);
      return false;
    }
  }

  /**
   * Check if a directory is a git repository
   */
  private async isGitRepository(dirPath: string): Promise<boolean> {
    try {
      await fs.promises.access(path.join(dirPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current git status
   */
  async getStatus(): Promise<GitStatus> {
    if (!this.git) {
      return { staged: [], unstaged: [], untracked: [] };
    }

    try {
      const status: StatusResult = await this.git.status();

      return {
        staged: status.staged,
        unstaged: [...status.modified, ...status.deleted].filter(file => !status.staged.includes(file)),
        untracked: status.not_added
      };
    } catch (error) {
      console.error('Failed to get status:', error);
      return { staged: [], unstaged: [], untracked: [] };
    }
  }

  /**
   * Stage files for commit
   */
  async addFiles(files: string[]): Promise<boolean> {
    if (!this.git) {
      return false;
    }

    try {
      await this.git.add(files);
      return true;
    } catch (error) {
      console.error('Failed to stage files:', error);
      return false;
    }
  }

  /**
   * Create a commit with the given message
   */
  async commit(message: string): Promise<boolean> {
    if (!this.git) {
      return false;
    }

    try {
      await this.git.commit(message);
      return true;
    } catch (error) {
      console.error('Failed to commit:', error);
      return false;
    }
  }

  /**
   * Get list of branches
   */
  async getBranches(): Promise<string[]> {
    if (!this.git) {
      return [];
    }

    try {
      const branches = await this.git.branch();
      return branches.all;
    } catch (error) {
      console.error('Failed to get branches:', error);
      return [];
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(name: string): Promise<boolean> {
    if (!this.git) {
      return false;
    }

    try {
      await this.git.checkoutBranch(name, 'HEAD');
      return true;
    } catch (error) {
      console.error('Failed to create branch:', error);
      return false;
    }
  }

  /**
   * Checkout to a branch
   */
  async checkoutBranch(name: string): Promise<boolean> {
    if (!this.git) {
      return false;
    }

    try {
      await this.git.checkout(name);
      return true;
    } catch (error) {
      console.error('Failed to checkout branch:', error);
      return false;
    }
  }

  /**
   * Merge a branch into the current branch
   */
  async mergeBranch(sourceBranch: string): Promise<boolean> {
    if (!this.git) {
      return false;
    }

    try {
      await this.git.merge([sourceBranch]);
      return true;
    } catch (error) {
      console.error('Failed to merge branch:', error);
      return false;
    }
  }

  /**
   * Rebase current branch onto another branch
   */
  async rebaseBranch(targetBranch: string): Promise<boolean> {
    if (!this.git) {
      return false;
    }

    try {
      await this.git.rebase([targetBranch]);
      return true;
    } catch (error) {
      console.error('Failed to rebase branch:', error);
      return false;
    }
  }

  /**
   * Get commit history with optional diffs
   */
  async getCommits(options: GetCommitsOptions = {}): Promise<CommitWithDiff[]> {
    if (!this.git) {
      console.log('Git not initialized');
      return [];
    }

    try {
      console.log('Getting commits with options:', options);

      // Use simple-git log with basic options
      const logOptions: Record<string, string | number> = {};

      if (options.limit) {
        logOptions.maxCount = options.limit;
      }

      if (options.skip) {
        logOptions.skip = options.skip;
      }

      if (options.messageFilter) {
        logOptions['--grep'] = options.messageFilter;
      }

      if (options.skip) {
        logOptions['--skip'] = options.skip.toString();
      }

      console.log('Git log options:', logOptions);

      // Try simple log first
      const logResult: LogResult = await this.git.log(logOptions);
      console.log('Git log result:', logResult.all.length, 'commits found');

      const commits: CommitWithDiff[] = logResult.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: new Date(commit.date),
        branch: commit.refs || undefined,
        diff: {
          files: [],
          totalAdditions: 0,
          totalDeletions: 0
        }
      }));



      // Load diffs if requested
      if (options.includeDiffs) {
        for (const commit of commits) {
          try {
            const diff = await this.git.show([commit.hash, '--stat', '--patch']);
            const diffData = this.parseDiff(diff);
            commit.diff = diffData;
          } catch (error) {
            console.warn(`Failed to load diff for commit ${commit.hash}:`, error);
          }
        }
      }

      return commits;
    } catch (error) {
      console.error('Failed to get commits:', error);
      return [];
    }
  }

  /**
   * Parse git show output into structured diff data
   */
  private parseDiff(diffOutput: string): CommitDiff {
    const lines = diffOutput.split('\n');
    const files: CommitWithDiff['diff']['files'] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    let currentFile: DiffFile | null = null;
    let inPatch = false;
    let patchLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        // Save previous file if exists
        if (currentFile) {
          currentFile.patch = patchLines.join('\n');
          files.push(currentFile);
        }

        // Start new file
        const match = line.match(/diff --git a\/(.+) b\/(.+)/);
        if (match) {
          currentFile = {
            filename: match[2],
            additions: 0,
            deletions: 0,
            patch: ''
          };
          inPatch = false;
          patchLines = [];
        }
      } else if (currentFile && line.startsWith('@@')) {
        // Start of patch hunk
        inPatch = true;
        patchLines.push(line);
      } else if (inPatch && currentFile) {
        patchLines.push(line);
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentFile.additions++;
          totalAdditions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentFile.deletions++;
          totalDeletions++;
        }
      }
    }

    // Save last file
    if (currentFile) {
      currentFile.patch = patchLines.join('\n');
      files.push(currentFile);
    }

    return {
      files,
      totalAdditions,
      totalDeletions
    };
  }

  /**
   * Cherry pick one or more commits
   */
  async cherryPickCommits(commitHashes: string[], targetBranch: string, options: CherryPickOptions = {}): Promise<CherryPickResult> {
    if (!this.git) {
      return {
        success: false,
        conflicts: [],
        appliedCommits: []
      };
    }

    const result: CherryPickResult = {
      success: true,
      conflicts: [],
      appliedCommits: []
    };

    // Get current branch for restoration later
    const currentBranch = await this.getCurrentBranch();
    const switchedBranch = currentBranch !== targetBranch;

    try {
      // Checkout target branch if different from current
      if (switchedBranch) {
        await this.git.checkout(targetBranch);
      }

      // Process each commit
      for (const commitHash of commitHashes) {
        try {
          const cherryPickArgs = [commitHash];

          if (options.noCommit) {
            cherryPickArgs.push('--no-commit');
          }

          await this.git.raw(['cherry-pick', ...cherryPickArgs]);

          result.appliedCommits.push(commitHash);
        } catch (error: unknown) {
          // Check if there are conflicts
          const status = await this.getStatus();
          if (status.unstaged.length > 0 || status.staged.length > 0) {
            result.conflicts = [...status.unstaged, ...status.staged];
            result.success = false;
            break;
          } else {
            // Other error
            throw error;
          }
        }
      }

      // If squashing multiple commits, create a single commit
      if (options.squash && commitHashes.length > 1 && result.success && !options.noCommit) {
        await this.git.commit(`Squashed ${commitHashes.length} commits`);
      }

    } catch (error) {
      console.error('Failed to cherry pick commits:', error);
      result.success = false;
    }

    // Restore original branch if we switched
    if (currentBranch !== targetBranch) {
      try {
        await this.git.checkout(currentBranch);
      } catch (checkoutError) {
        console.error('Failed to restore original branch:', checkoutError);
      }
    }

    return result;
  }

  /**
   * Get current branch name
   */
  private async getCurrentBranch(): Promise<string> {
    if (!this.git) {
      return '';
    }

    try {
      const branches = await this.git.branch();
      return branches.current;
    } catch (error) {
      console.error('Failed to get current branch:', error);
      return '';
    }
  }

  /**
   * Get current repository information
   */
  async getCurrentRepository(): Promise<Repository | null> {
    if (!this.git || !this.currentPath) {
      return null;
    }

    try {
      const status = await this.getStatus();
      const branches = await this.git.branch();
      const currentBranch = branches.current;

      return {
        path: this.currentPath,
        name: path.basename(this.currentPath),
        currentBranch,
        status
      };
    } catch (error) {
      console.error('Failed to get current repository:', error);
      return {
        path: this.currentPath,
        name: path.basename(this.currentPath)
      };
    }
  }

  /**
   * Discover git repositories in specified paths
   */
  async discoverRepositories(scanPaths: string[]): Promise<Repository[]> {
    const repositories: Repository[] = [];

    console.log('Checking paths for repositories:', scanPaths);

    const pathsToCheck = scanPaths;

    for (const checkPath of pathsToCheck) {
      try {
        console.log('Scanning directory:', checkPath);
        const foundRepos = await this.scanDirectoryForRepos(checkPath);
        console.log('Found repos in', checkPath, ':', foundRepos.length);
        repositories.push(...foundRepos);
      } catch (error) {
        console.log('Error scanning directory:', checkPath, error);
        // Skip directories that don't exist or can't be read
        continue;
      }
    }

    // Remove duplicates based on path (case-insensitive)
    const repoMap = new Map<string, Repository>();
    for (const repo of repositories) {
      const key = repo.path.toLowerCase();
      if (!repoMap.has(key)) {
        repoMap.set(key, repo);
      }
    }
    const uniqueRepos = Array.from(repoMap.values());

    return uniqueRepos;
  }

  /**
   * Recursively scan a directory for git repositories
   */
  private async scanDirectoryForRepos(dirPath: string): Promise<Repository[]> {
    const repositories: Repository[] = [];

    try {
      const stats = await fs.promises.stat(dirPath);
      if (!stats.isDirectory()) {
        return repositories;
      }

      const items = await fs.promises.readdir(dirPath);

      // Check if current directory is a git repo
      if (items.includes('.git')) {
        try {
          console.log('Found .git in:', dirPath);
          const tempGit = simpleGit(dirPath);
          const branches = await tempGit.branch();
          const currentBranch = branches.current;
          console.log('Repository branch:', currentBranch);

          repositories.push({
            path: dirPath,
            name: path.basename(dirPath),
            currentBranch,
          });
        } catch (error) {
          console.log('Error opening git repo:', dirPath, error);
          // Not a valid git repo, skip
        }
      }

      // Recursively scan subdirectories (but limit depth for performance)
      for (const item of items.slice(0, 10)) { // Limit subdirs to scan
        if (item.startsWith('.')) continue; // Skip hidden directories

        const fullPath = path.join(dirPath, item);
        try {
          const itemStats = await fs.promises.stat(fullPath);
          if (itemStats.isDirectory()) {
            // Only scan one level deep for performance
            const subRepos = await this.scanDirectoryForRepos(fullPath);
            repositories.push(...subRepos);
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return repositories;
  }

  /**
   * Get recently opened repositories from storage
   */
  private async getRecentRepositories(): Promise<string[]> {
    // For now, return empty array. This could be enhanced to read from a config file
    // or use electron-store for persistent storage
    return [];
  }

  /**
   * Close the current repository
   */
  closeRepository(): void {
    this.git = null;
    this.currentPath = null;
  }
}