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
import { FolderOpen, Add, Refresh, Delete } from '@mui/icons-material';
import { Repository } from '../types';

interface SidebarProps {
  repositories: Repository[];
  currentRepository: Repository | null;
  onRepositorySelect: (repo: Repository) => void;
  onAddRepository: () => void;
  onRefresh: () => void;
  scanPaths: string[];
  onAddScanPath: () => void;
  onRemoveScanPath: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  repositories,
  currentRepository,
  onRepositorySelect,
  onAddRepository,
  onRefresh,
  scanPaths,
  onAddScanPath,
  onRemoveScanPath
}) => {
  return (
    <Box sx={{ width: 250, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
      <List sx={{ flex: 1, overflow: 'auto' }}>
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
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          Scan Paths
        </Typography>
        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
          {scanPaths.map((path, index) => (
            <ListItem key={path} disablePadding>
              <ListItemButton>
                <ListItemText primary={path} />
                <IconButton size="small" onClick={() => onRemoveScanPath(index)}>
                  <Delete />
                </IconButton>
              </ListItemButton>
            </ListItem>
          ))}
          {scanPaths.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No scan paths"
                secondary="Add a directory to scan for repositories"
              />
            </ListItem>
          )}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
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
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={onAddScanPath}
        >
          Add Scan Path
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;