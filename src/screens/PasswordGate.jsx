import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert, Container } from '@mui/material';

const SESSION_KEY = 'wp_authed';

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated this session
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setUnlocked(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setUnlocked(true);
      } else {
        setError('Wrong password.');
      }
    } catch {
      setError('Connection error. Try again.');
    }
  };

  if (loading) return null;
  if (unlocked) return children;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: '400px', textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>
          Web Prospector
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter password to continue.
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            sx={{ mb: 2 }}
            autoFocus
          />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Button variant="contained" size="large" fullWidth type="submit">
            Enter
          </Button>
        </form>
      </Container>
    </Box>
  );
}
