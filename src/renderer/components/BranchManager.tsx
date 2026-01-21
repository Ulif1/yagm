import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography
} from '@mui/material';
import { Add, Merge, CallSplit } from '@mui/icons-material';

interface BranchManagerProps {
  currentBranch?: string;
  branches: string[];
  onBranchChange: (branch: string) => void;
  onCreateBranch: (name: string) => void;
  onMergeBranch: (sourceBranch: string) => void;
}

const BranchManager: React.FC<BranchManagerProps> = ({
  currentBranch,
  branches,
  onBranchChange,
  onCreateBranch,
  onMergeBranch
}) => {
  const [selectedBranch, setSelectedBranch] = useState(currentBranch || '');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [mergeSourceBranch, setMergeSourceBranch] = useState('');

  useEffect(() => {
    setSelectedBranch(currentBranch || '');
  }, [currentBranch]);

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    onBranchChange(branch);
  };

  const handleCreateBranch = () => {
    if (newBranchName.trim()) {
      onCreateBranch(newBranchName.trim());
      setNewBranchName('');
      setCreateDialogOpen(false);
    }
  };

  const handleMergeBranch = () => {
    if (mergeSourceBranch) {
      onMergeBranch(mergeSourceBranch);
      setMergeSourceBranch('');
      setMergeDialogOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Branch</InputLabel>
        <Select
          value={selectedBranch}
          label="Branch"
          onChange={(e) => handleBranchChange(e.target.value)}
        >
          {branches.map((branch) => (
            <MenuItem key={branch} value={branch}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CallSplit fontSize="small" />
                {branch}
                {branch === currentBranch && (
                  <Typography variant="caption" color="primary">
                    (current)
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        size="small"
        startIcon={<Add />}
        onClick={() => setCreateDialogOpen(true)}
      >
        New Branch
      </Button>

      <Button
        size="small"
        startIcon={<Merge />}
        onClick={() => setMergeDialogOpen(true)}
        disabled={!currentBranch}
      >
        Merge
      </Button>

      {/* Create Branch Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Branch</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Branch Name"
            fullWidth
            variant="outlined"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Branch Dialog */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)}>
        <DialogTitle>Merge Branch</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Merge another branch into &ldquo;{currentBranch}&rdquo;
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Source Branch</InputLabel>
            <Select
              value={mergeSourceBranch}
              label="Source Branch"
              onChange={(e) => setMergeSourceBranch(e.target.value)}
            >
              {branches
                .filter(branch => branch !== currentBranch)
                .map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMergeBranch} disabled={!mergeSourceBranch}>
            Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BranchManager;