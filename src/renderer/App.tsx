import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { Repository } from './types';

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

  // Load repositories on app start
  useEffect(() => {
    loadRepositories();
  }, []);

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
        />
        <MainContent
          currentRepository={currentRepository}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;