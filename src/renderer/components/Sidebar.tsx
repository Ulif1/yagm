import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Divider,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import { FolderOpen, Add, Refresh } from '@mui/icons-material';
import { Repository } from '../types';

interface SidebarProps {
  repositories: Repository[];
  currentRepository: Repository | null;
  onRepositorySelect: (repo: Repository) => void;
  onAddRepository: () => void;
  onRefresh: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  repositories,
  currentRepository,
  onRepositorySelect,
  onAddRepository,
  onRefresh
}) => {
  return (
    <Box sx={{ width: 250, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          Repositories
        </Typography>
        <Tooltip title="Refresh repositories">
          <IconButton size="small" onClick={onRefresh}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <List sx={{ flex: 1 }}>
        {repositories.map((repo) => (
          <ListItem key={repo.path} disablePadding>
            <ListItemButton
              selected={currentRepository?.path === repo.path}
              onClick={() => onRepositorySelect(repo)}
            >
              <ListItemIcon>
                <FolderOpen />
              </ListItemIcon>
              <ListItemText
                primary={repo.name}
                secondary={repo.currentBranch || 'No branch'}
              />
            </ListItemButton>
          </ListItem>
        ))}
        {repositories.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No repositories"
              secondary="Add a repository to get started"
            />
          </ListItem>
        )}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={onAddRepository}
        >
          Add Repository
        </Button>
        <Button
          fullWidth
          variant="text"
          size="small"
          onClick={async () => {
            try {
              // Try to open current working directory
              const success = await window.electronAPI.repositories.open('.');
              if (success) {
                // Refresh repositories and get current
                onRefresh();
                setTimeout(() => {
                  window.electronAPI.repositories.getCurrent().then(current => {
                    if (current) {
                      // This would need to be passed up to the parent
                      console.log('Opened current directory:', current);
                    }
                  });
                }, 500);
              }
            } catch (error) {
              console.error('Failed to open current directory:', error);
            }
          }}
        >
          Open Current Directory
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;