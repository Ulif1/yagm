import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import { CommitWithDiff, CherryPickResult } from '../types';

interface CherryPickDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCommits: CommitWithDiff[];
  availableBranches: string[];
  currentBranch: string;
  onCherryPick: (commitHashes: string[], targetBranch: string, options: {
    noCommit?: boolean;
    squash?: boolean;
  }) => Promise<CherryPickResult>;
}

// Global operation lock to prevent simultaneous cherry-picks
let isCherryPickingInProgress = false;

const CherryPickDialog: React.FC<CherryPickDialogProps> = ({
  open,
  onClose,
  selectedCommits,
  availableBranches,
  currentBranch,
  onCherryPick
}) => {
  const [targetBranch, setTargetBranch] = useState('');
  const [noCommit, setNoCommit] = useState(false);
  const [squash, setSquash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CherryPickResult | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentCommit: '' });

  React.useEffect(() => {
    if (open) {
      setTargetBranch(currentBranch);
      setNoCommit(false);
      setSquash(false);
      setResult(null);
      setProgress({ current: 0, total: 0, currentCommit: '' });
    }
  }, [open, currentBranch]);

  const handleCherryPick = async () => {
    if (!targetBranch || selectedCommits.length === 0) return;

    // Prevent simultaneous cherry-pick operations
    if (isCherryPickingInProgress) {
      console.warn('Cherry-pick operation already in progress, ignoring request');
      return;
    }

    isCherryPickingInProgress = true;
    setLoading(true);
    setResult(null);
    setProgress({ current: 0, total: selectedCommits.length, currentCommit: '' });

    // Simulate progress for multi-commit operations
    let progressInterval: NodeJS.Timeout | null = null;
    if (selectedCommits.length > 1) {
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 10, 90); // Cap at 90% until completion
        setProgress(prev => ({
          ...prev,
          current: Math.floor((currentProgress / 100) * selectedCommits.length)
        }));
      }, 200);
    }

    try {
      const result = await onCherryPick(
        selectedCommits.map(c => c.hash),
        targetBranch,
        { noCommit, squash }
      );
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Update progress based on actual result
      setProgress({
        current: result.appliedCommits.length,
        total: selectedCommits.length,
        currentCommit: ''
      });
      
      setResult(result);
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error('Cherry pick failed:', error);
      setResult({
        success: false,
        conflicts: [],
        appliedCommits: []
      });
    } finally {
      setLoading(false);
      isCherryPickingInProgress = false;
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Cherry Pick Commits</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Apply {selectedCommits.length} selected commit{selectedCommits.length !== 1 ? 's' : ''} to another branch.
        </Typography>

        {/* Selected commits preview */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Selected Commits:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedCommits.slice(0, 3).map((commit) => (
              <Chip
                key={commit.hash}
                label={`${commit.hash.substring(0, 7)}: ${commit.message.substring(0, 30)}${commit.message.length > 30 ? '...' : ''}`}
                size="small"
                variant="outlined"
              />
            ))}
            {selectedCommits.length > 3 && (
              <Chip
                label={`+${selectedCommits.length - 3} more`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Target branch selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Target Branch</InputLabel>
          <Select
            value={targetBranch}
            label="Target Branch"
            onChange={(e) => setTargetBranch(e.target.value)}
            disabled={loading}
          >
            {availableBranches.map((branch) => (
              <MenuItem key={branch} value={branch}>
                {branch}
                {branch === currentBranch && ' (current)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Options */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={noCommit}
                onChange={(e) => setNoCommit(e.target.checked)}
                disabled={loading}
              />
            }
            label="Stage changes without committing"
          />
          {selectedCommits.length > 1 && (
            <FormControlLabel
              control={
                <Switch
                  checked={squash}
                  onChange={(e) => setSquash(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Squash into single commit"
            />
          )}
        </Box>

        {/* Result display */}
        {result && (
          <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            {result.success ? (
              <Box>
                <Typography variant="body2">
                  Successfully applied {result.appliedCommits.length} commit{result.appliedCommits.length !== 1 ? 's' : ''}.
                </Typography>
                {result.appliedCommits.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Applied: {result.appliedCommits.map(hash => hash.substring(0, 7)).join(', ')}
                  </Typography>
                )}
              </Box>
              ) : (
                <Box>
                  <Typography variant="body2">
                    Cherry pick failed.
                  </Typography>
                  {result.errorMessage && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
                      {result.errorMessage}
                    </Typography>
                  )}
                  {result.conflicts.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Conflicts in: {result.conflicts.join(', ')}
                    </Typography>
                  )}
                  {result.errorType && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                      Error type: {result.errorType.replace('_', ' ')}
                    </Typography>
                  )}
                </Box>
              )}
          </Alert>
        )}

        {loading && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">
                Applying commits... {progress.current > 0 && `(${progress.current}/${progress.total})`}
              </Typography>
            </Box>
            {progress.total > 1 && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(progress.current / progress.total) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  Processing {progress.current} of {progress.total} commits
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            onClick={handleCherryPick}
            variant="contained"
            disabled={!targetBranch || selectedCommits.length === 0 || loading}
          >
            Cherry Pick
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CherryPickDialog;