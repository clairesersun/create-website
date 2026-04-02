import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import useStore from '../store/useStore';

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const isHome = location.pathname === '/';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {!isHome && (
            <IconButton
              edge="start"
              aria-label="Go back"
              onClick={() => navigate(-1)}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
            }}
          >
            Web Prospector
          </Typography>
          <IconButton
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleDarkMode}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: { xs: '480px', md: '720px' },
          px: { xs: 2, sm: 3 },
          py: 3,
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
