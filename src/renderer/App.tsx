import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import CommitHistory from './components/CommitHistory';
import CherryPickDialog from './components/CherryPickDialog';
import { Repository, CommitWithDiff, CherryPickResult } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [currentRepository, setCurrentRepository] = useState<Repository | null>(null);
  const [scanPaths, setScanPaths] = useState<string[]>([]);
  const [selectedCommits, setSelectedCommits] = useState<CommitWithDiff[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [cherryPickDialogOpen, setCherryPickDialogOpen] = useState(false);

  // Load config and repositories on app start
  useEffect(() => {
    loadConfig();
    loadRepositories();
  }, []);

  // Load branches when repository changes
  useEffect(() => {
    if (currentRepository) {
      loadBranches();
    } else {
      setBranches([]);
    }
  }, [currentRepository]);

  const loadConfig = async () => {
    try {
      const config = await (window.electronAPI as any).config.load();
      setScanPaths(config.scanPaths);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const branchList = await (window.electronAPI.git as any).getBranches();
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const loadRepositories = async () => {
    try {
      console.log('Discovering repositories...');
      const repos = await window.electronAPI.repositories.discover();
      console.log('Discovered repositories:', repos);
      setRepositories(repos);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    }
  };

  const handleRepositorySelect = async (repo: Repository) => {
    try {
      console.log('Opening repository:', repo.path);
      const success = await window.electronAPI.repositories.open(repo.path);
      console.log('Repository open result:', success);
      if (success) {
        const current = await window.electronAPI.repositories.getCurrent();
        console.log('Current repository after open:', current);
        setCurrentRepository(current || repo);
      }
    } catch (error) {
      console.error('Failed to open repository:', error);
    }
  };

  const handleAddRepository = async () => {
    try {
      const path = await window.electronAPI.dialog.openDirectory();
      if (path) {
        const success = await window.electronAPI.repositories.open(path);
        if (success) {
          // Refresh repository list
          await loadRepositories();
          // Try to get the newly opened repository
          const current = await window.electronAPI.repositories.getCurrent();
          if (current) {
            setCurrentRepository(current);
          }
        }
      }
    } catch (error) {
      console.error('Failed to add repository:', error);
    }
  };

  const handleAddScanPath = async () => {
    try {
      const path = await window.electronAPI.dialog.openDirectory();
      if (path) {
        const newScanPaths = [...scanPaths, path];
        setScanPaths(newScanPaths);
        await (window.electronAPI as any).config.save({ scanPaths: newScanPaths });
        await loadRepositories(); // Refresh repos
      }
    } catch (error) {
      console.error('Failed to add scan path:', error);
    }
  };

  const handleRemoveScanPath = async (index: number) => {
    const newScanPaths = scanPaths.filter((_, i) => i !== index);
    setScanPaths(newScanPaths);
    await (window.electronAPI as any).config.save({ scanPaths: newScanPaths });
    await loadRepositories(); // Refresh repos
  };

  const handleCherryPick = async (
    commitHashes: string[],
    targetBranch: string,
    options: { noCommit?: boolean; squash?: boolean }
  ): Promise<CherryPickResult> => {
    try {
      return await (window.electronAPI.git as any).cherryPickCommits(commitHashes, targetBranch, options);
    } catch (error) {
      console.error('Cherry pick failed:', error);
      return {
        success: false,
        conflicts: [],
        appliedCommits: []
      };
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Sidebar
          repositories={repositories}
          currentRepository={currentRepository}
          onRepositorySelect={handleRepositorySelect}
          onAddRepository={handleAddRepository}
          onRefresh={loadRepositories}
          scanPaths={scanPaths}
          onAddScanPath={handleAddScanPath}
          onRemoveScanPath={handleRemoveScanPath}
        />
        <Box sx={{ position: 'relative' }}>
          <CommitHistory
            currentRepository={currentRepository}
            onCommitsSelected={setSelectedCommits}
          />
          {selectedCommits.length > 0 && (
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, bgcolor: 'primary.light', borderRadius: 1, m: 2 }}>
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
        </Box>
        <Box sx={{ width: 400 }}>
          <MainContent
            currentRepository={currentRepository}
          />
        </Box>

        <CherryPickDialog
          open={cherryPickDialogOpen}
          onClose={() => setCherryPickDialogOpen(false)}
          selectedCommits={selectedCommits}
          availableBranches={branches}
          currentBranch={currentRepository?.currentBranch || ''}
          onCherryPick={handleCherryPick}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;