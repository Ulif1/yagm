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
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={onAddRepository}
        >
          Add Repository
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;