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

  React.useEffect(() => {
    if (open) {
      setTargetBranch(currentBranch);
      setNoCommit(false);
      setSquash(false);
      setResult(null);
    }
  }, [open, currentBranch]);

  const handleCherryPick = async () => {
    if (!targetBranch || selectedCommits.length === 0) return;

    setLoading(true);
    setResult(null);

    try {
      const result = await onCherryPick(
        selectedCommits.map(c => c.hash),
        targetBranch,
        { noCommit, squash }
      );
      setResult(result);
    } catch (error) {
      console.error('Cherry pick failed:', error);
      setResult({
        success: false,
        conflicts: [],
        appliedCommits: []
      });
    } finally {
      setLoading(false);
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
                {result.conflicts.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Conflicts in: {result.conflicts.join(', ')}
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Applying commits...</Typography>
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