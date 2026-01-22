import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { GitStatus, Repository, CommitWithDiff, CherryPickResult } from '../types';
import CommitHistory from './CommitHistory';
import BranchManager from './BranchManager';
import CherryPickDialog from './CherryPickDialog';

interface MainContentProps {
  currentRepository: Repository | null;
  onRepositoryUpdate?: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
  currentRepository,
  onRepositoryUpdate
}) => {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedCommits, setSelectedCommits] = useState<CommitWithDiff[]>([]);
  const [cherryPickDialogOpen, setCherryPickDialogOpen] = useState(false);

  // Load git status and branches when repository changes
  useEffect(() => {
    if (currentRepository) {
      loadGitStatus();
      loadBranches();
    } else {
      setStatus(null);
      setBranches([]);
    }
  }, [currentRepository]);

  const loadGitStatus = async () => {
    try {
      const gitStatus = await window.electronAPI.git.getStatus();
      setStatus(gitStatus);
    } catch (error) {
      console.error('Failed to load git status:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const branchList = await window.electronAPI.git.getBranches();
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const handleStageFiles = async (files: string[]) => {
    try {
      await window.electronAPI.git.addFiles(files);
      await loadGitStatus(); // Refresh status
    } catch (error) {
      console.error('Failed to stage files:', error);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    try {
      await window.electronAPI.git.commit(commitMessage);
      setCommitMessage('');
      await loadGitStatus(); // Refresh status
    } catch (error) {
      console.error('Failed to commit:', error);
    }
  };

  const handleBranchChange = async (branchName: string) => {
    try {
      await window.electronAPI.git.checkoutBranch(branchName);
      await loadGitStatus();
      await loadBranches();
      onRepositoryUpdate?.();
    } catch (error) {
      console.error('Failed to checkout branch:', error);
    }
  };

  const handleCreateBranch = async (branchName: string) => {
    try {
      await window.electronAPI.git.createBranch(branchName);
      await loadBranches();
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  const handleMergeBranch = async (sourceBranch: string) => {
    try {
      await window.electronAPI.git.mergeBranch(sourceBranch);
      await loadGitStatus();
      await loadBranches();
    } catch (error) {
      console.error('Failed to merge branch:', error);
    }
  };

  const handleCommitsSelected = (commits: CommitWithDiff[]) => {
    setSelectedCommits(commits);
  };

  const handleCherryPick = async (
    commitHashes: string[],
    targetBranch: string,
    options: { noCommit?: boolean; squash?: boolean }
  ): Promise<CherryPickResult> => {
    try {
      return await window.electronAPI.git.cherryPickCommits(commitHashes, targetBranch, options);
    } catch (error) {
      console.error('Cherry pick failed:', error);
      return {
        success: false,
        conflicts: [],
        appliedCommits: []
      };
    }
  };

  const handleCherryPickDialogClose = () => {
    setCherryPickDialogOpen(false);
    setSelectedCommits([]);
  };

  if (!currentRepository) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h1">
            Yet Another Git Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a repository to get started
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Welcome to YAGM
            </Typography>
            <Typography variant="body1">
              Add a git repository to start managing your code with this Electron-based git client.
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5" component="h1">
          {currentRepository.name}
        </Typography>
        <BranchManager
          currentBranch={currentRepository.currentBranch}
          branches={branches}
          onBranchChange={handleBranchChange}
          onCreateBranch={handleCreateBranch}
          onMergeBranch={handleMergeBranch}
        />
      </Box>

      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {/* Changes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Changes
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Files ready to commit
                </Typography>

                {status?.staged && status.staged.length > 0 ? (
                  <List dense>
                    {status.staged.map((file) => (
                      <ListItem key={file}>
                        <ListItemText primary={file} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No staged changes
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Modified files
                </Typography>

                {status?.unstaged && status.unstaged.length > 0 ? (
                  <List dense>
                    {status.unstaged.map((file) => (
                      <ListItem key={file}>
                        <ListItemText primary={file} />
                        <Button
                          size="small"
                          onClick={() => handleStageFiles([file])}
                        >
                          Stage
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No modified files
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Commit */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Commit
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter commit message..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  sx={{ mb: 2 }}
                />
                 <Button
                   fullWidth
                   variant="contained"
                   disabled={!commitMessage.trim() || !status?.staged?.length}
                   onClick={handleCommit}
                 >
                   Commit Changes
                 </Button>
                 <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                   <Button
                     fullWidth
                     variant="outlined"
                     onClick={async () => {
                       try {
                         const success = await (window.electronAPI.git as any).pull();
                         if (success) {
                           loadGitStatus();
                           // Optionally refresh commits
                         } else {
                           alert('Pull failed');
                         }
                       } catch (error) {
                         console.error('Pull failed:', error);
                         alert('Pull failed: ' + (error as Error).message);
                       }
                     }}
                   >
                     Pull
                   </Button>
                   <Button
                     fullWidth
                     variant="outlined"
                     onClick={async () => {
                       try {
                         const success = await (window.electronAPI.git as any).push();
                         if (success) {
                           loadGitStatus();
                           // Optionally refresh commits
                         } else {
                           alert('Push failed');
                         }
                       } catch (error) {
                         console.error('Push failed:', error);
                         alert('Push failed: ' + (error as Error).message);
                       }
                     }}
                   >
                     Push
                   </Button>
                 </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <CommitHistory
          currentRepository={currentRepository}
          onCommitsSelected={handleCommitsSelected}
        />

        {selectedCommits.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {selectedCommits.length} commit{selectedCommits.length !== 1 ? 's' : ''} selected
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={() => setCherryPickDialogOpen(true)}
            >
              Cherry Pick to Branch
            </Button>
          </Box>
        )}

        <CherryPickDialog
          open={cherryPickDialogOpen}
          onClose={handleCherryPickDialogClose}
          selectedCommits={selectedCommits}
          availableBranches={branches}
          currentBranch={currentRepository?.currentBranch || ''}
          onCherryPick={handleCherryPick}
        />
      </Box>
    </Box>
  );
};

export default MainContent;