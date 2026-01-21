import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Avatar,
  Paper
} from '@mui/material';
import { Repository } from '../types';

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  branch?: string;
}

interface CommitHistoryProps {
  currentRepository: Repository | null;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  branch?: string;
}

const CommitHistory: React.FC<CommitHistoryProps> = ({ currentRepository }) => {
  const [commits, setCommits] = useState<Commit[]>([]);

  useEffect(() => {
    if (currentRepository) {
      loadCommitHistory();
    } else {
      setCommits([]);
    }
  }, [currentRepository]);

  const loadCommitHistory = async () => {
    try {
      // TODO: Implement commit history loading from git service
      // For now, show placeholder data
      setCommits([
        {
          hash: 'abc123',
          message: 'Initial commit',
          author: 'Developer',
          date: new Date(),
          branch: 'main'
        }
      ]);
    } catch (error) {
      console.error('Failed to load commit history:', error);
    }
  };

  if (!currentRepository) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Commit History
      </Typography>
      <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
        <List dense>
          {commits.map((commit, index) => (
            <React.Fragment key={commit.hash}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                        {commit.hash.substring(0, 7)}
                      </Typography>
                      <Typography variant="body1">
                        {commit.message}
                      </Typography>
                      {commit.branch && (
                        <Chip
                          label={commit.branch}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 'auto' }}
                        />
                      )}
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
                    </Box>
                  }
                />
              </ListItem>
              {index < commits.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
        {commits.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No commits yet
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CommitHistory;