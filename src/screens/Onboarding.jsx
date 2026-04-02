import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import useStore from '../store/useStore';
import { validatePat } from '../services/github';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Claire Sersun');
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setUserName = useStore((s) => s.setUserName);
  const setGithubPat = useStore((s) => s.setGithubPat);
  const setGithubUsername = useStore((s) => s.setGithubUsername);
  const setOnboardingComplete = useStore((s) => s.setOnboardingComplete);

  const handleSkip = () => {
    setUserName(name || 'Claire Sersun');
    setOnboardingComplete(true);
  };

  const handleNameNext = () => {
    setUserName(name || 'Claire Sersun');
    setStep(3);
  };

  const handlePatSubmit = async () => {
    if (!pat.trim()) {
      setError('Please enter your GitHub PAT.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const username = await validatePat(pat.trim());
      setGithubPat(pat.trim());
      setGithubUsername(username);
      setOnboardingComplete(true);
    } catch {
      setError('Invalid GitHub PAT. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

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
      <Container maxWidth={false} sx={{ maxWidth: '480px' }}>
        {step === 1 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>
              Hi, I'm Web Prospector.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
              I find local businesses without websites — so you can reach out,
              deliver value, and grow your design business.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="text" onClick={handleSkip}>
                Skip
              </Button>
              <Button variant="contained" size="large" onClick={() => setStep(2)}>
                Next →
              </Button>
            </Box>
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>
              What's your name?
            </Typography>
            <TextField
              fullWidth
              label="Your name (used in outreach emails)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 3, mt: 2 }}
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="text" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button variant="contained" size="large" onClick={handleNameNext}>
                Next →
              </Button>
            </Box>
          </Box>
        )}

        {step === 3 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>
              Connect your GitHub.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Paste your GitHub Personal Access Token below. It needs{' '}
              <code>repo</code> and <code>pages</code> write permissions.
            </Typography>
            <Button
              variant="text"
              size="small"
              href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mb: 2 }}
            >
              How to create a GitHub PAT →
            </Button>
            <TextField
              fullWidth
              label="Paste your PAT here"
              type={showPat ? 'text' : 'password'}
              value={pat}
              onChange={(e) => {
                setPat(e.target.value);
                setError('');
              }}
              sx={{ mb: 2 }}
              autoFocus
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPat ? 'Hide PAT' : 'Show PAT'}
                        onClick={() => setShowPat(!showPat)}
                        edge="end"
                      >
                        {showPat ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="text" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handlePatSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Validating...' : "Let's go →"}
              </Button>
            </Box>
            <Button
              variant="text"
              size="small"
              sx={{ mt: 2 }}
              onClick={handleSkip}
            >
              Skip for now
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
