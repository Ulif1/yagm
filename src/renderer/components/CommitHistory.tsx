import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Avatar,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Button,
  CircularProgress
} from '@mui/material';
import { Search, ExpandMore, ExpandLess, Code, ViewList, Refresh } from '@mui/icons-material';
import { Repository, CommitWithDiff, GetCommitsOptions } from '../types';

interface CommitHistoryProps {
  currentRepository: Repository | null;
  onCommitsSelected?: (commits: CommitWithDiff[]) => void;
}

const CommitHistory: React.FC<CommitHistoryProps> = ({ currentRepository, onCommitsSelected }) => {
  const [commits, setCommits] = useState<CommitWithDiff[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [diffViewMode, setDiffViewMode] = useState<'unified' | 'split'>('unified');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const loadCommits = useCallback(async (reset: boolean = false) => {
    if (!currentRepository) return;

    setLoading(true);
    try {
      const options: GetCommitsOptions = {
        limit: PAGE_SIZE,
        skip: reset ? 0 : page * PAGE_SIZE,
        messageFilter: searchFilter || undefined,
        includeDiffs: true
      };

      console.log('Loading commits with options:', options);
      const newCommits = await window.electronAPI.git.getCommits(options);
      console.log('Loaded commits:', newCommits);

      if (reset) {
        setCommits(newCommits);
        setPage(1);
      } else {
        setCommits(prev => [...prev, ...newCommits]);
        setPage(prev => prev + 1);
      }

      setHasMore(newCommits.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load commits:', error);
      // Show empty state on error
      if (reset) {
        setCommits([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentRepository, page, searchFilter]);

  useEffect(() => {
    console.log('CommitHistory useEffect triggered, currentRepository:', currentRepository);
    if (currentRepository) {
      console.log('Loading commits for repository:', currentRepository.path);
      loadCommits(true);
    } else {
      console.log('No current repository, clearing commits');
      setCommits([]);
      setPage(0);
      setHasMore(true);
    }
  }, [currentRepository, loadCommits]);

  useEffect(() => {
    if (onCommitsSelected) {
      const selected = commits.filter(commit => selectedCommits.has(commit.hash));
      onCommitsSelected(selected);
    }
  }, [selectedCommits, commits, onCommitsSelected]);

  const handleToggleExpand = (commitHash: string) => {
    setExpandedCommits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commitHash)) {
        newSet.delete(commitHash);
      } else {
        newSet.add(commitHash);
      }
      return newSet;
    });
  };

  const handleToggleSelect = (commitHash: string) => {
    setSelectedCommits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commitHash)) {
        newSet.delete(commitHash);
      } else {
        newSet.add(commitHash);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCommits.size === commits.length) {
      setSelectedCommits(new Set());
    } else {
      setSelectedCommits(new Set(commits.map(c => c.hash)));
    }
  };

  const handleSearch = (value: string) => {
    setSearchFilter(value);
    // Debounce search
    setTimeout(() => loadCommits(true), 300);
  };

  const filteredCommits = commits.filter(commit =>
    !searchFilter || commit.message.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (!currentRepository) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Commit History
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => setDiffViewMode(diffViewMode === 'unified' ? 'split' : 'unified')}>
            {diffViewMode === 'unified' ? <Code /> : <ViewList />}
          </IconButton>
          <IconButton size="small" onClick={() => loadCommits(true)}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search commits..."
          value={searchFilter}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />
        {onCommitsSelected && (
          <Button
            size="small"
            variant={selectedCommits.size > 0 ? "contained" : "outlined"}
            onClick={handleSelectAll}
          >
            {selectedCommits.size === filteredCommits.length && selectedCommits.size > 0
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        )}
      </Box>

      <Paper sx={{ maxHeight: 600, overflow: 'auto' }}>
        <List dense>
          {filteredCommits.map((commit, index) => (
            <React.Fragment key={commit.hash}>
              <ListItem alignItems="flex-start">
                {onCommitsSelected && (
                  <input
                    type="checkbox"
                    checked={selectedCommits.has(commit.hash)}
                    onChange={() => handleToggleSelect(commit.hash)}
                    style={{ marginRight: 8, marginTop: 8 }}
                  />
                )}
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary', minWidth: 80 }}>
                        {commit.hash.substring(0, 7)}
                      </Typography>
                      <Typography variant="body1" sx={{ flex: 1 }}>
                        {commit.message}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {commit.branch && (
                          <Chip
                            label={commit.branch}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpand(commit.hash)}
                        >
                          {expandedCommits.has(commit.hash) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                        {commit.author.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {commit.author}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {commit.date.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                        +{commit.diff.totalAdditions} -{commit.diff.totalDeletions}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <Collapse in={expandedCommits.has(commit.hash)} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                  <Typography variant="h6" sx={{ fontSize: '1rem', mb: 1 }}>
                    Changes
                  </Typography>
                  {commit.diff.files.map((file, fileIndex) => (
                    <Box key={fileIndex} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                        {file.filename} (+{file.additions} -{file.deletions})
                      </Typography>
                      <Box sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        bgcolor: 'grey.50',
                        p: 1,
                        mt: 0.5,
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {diffViewMode === 'unified' ? file.patch : file.patch}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Collapse>

              {index < filteredCommits.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && hasMore && filteredCommits.length > 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Button onClick={() => loadCommits()}>
              Load More Commits
            </Button>
          </Box>
        )}

        {filteredCommits.length === 0 && !loading && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchFilter ? 'No commits match your search' : 'No commits yet'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CommitHistory;