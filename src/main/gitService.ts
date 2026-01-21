import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { GitStatus, Repository } from './types';

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
        unstaged: [...status.modified, ...status.deleted],
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
   * Discover git repositories in common locations
   */
  async discoverRepositories(): Promise<Repository[]> {
    const repositories: Repository[] = [];
    const commonPaths = [
      path.join(os.homedir(), 'Projects'),
      path.join(os.homedir(), 'Documents'),
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), 'workspace'),
      path.join(os.homedir(), 'code'),
    ];

    // Also check recently opened repositories (stored in a simple file)
    const recentRepos = await this.getRecentRepositories();

    const pathsToCheck = [...commonPaths, ...recentRepos];

    for (const checkPath of pathsToCheck) {
      try {
        const foundRepos = await this.scanDirectoryForRepos(checkPath);
        repositories.push(...foundRepos);
      } catch (error) {
        // Skip directories that don't exist or can't be read
        continue;
      }
    }

    // Remove duplicates based on path
    const uniqueRepos = repositories.filter((repo, index, self) =>
      index === self.findIndex(r => r.path === repo.path)
    );

    return uniqueRepos.slice(0, 50); // Limit to 50 repos for performance
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
          const tempGit = simpleGit(dirPath);
          const branches = await tempGit.branch();
          const currentBranch = branches.current;

          repositories.push({
            path: dirPath,
            name: path.basename(dirPath),
            currentBranch,
          });
        } catch (error) {
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