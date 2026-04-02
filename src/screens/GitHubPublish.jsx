import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import useStore from '../store/useStore';
import { validatePat, createRepo, uploadFile, enablePages, waitForPages, slugify, processPhotosForPublish } from '../services/github';

export default function GitHubPublish() {
  const navigate = useNavigate();
  const githubPat = useStore((s) => s.githubPat);
  const githubUsername = useStore((s) => s.githubUsername);
  const setGithubPat = useStore((s) => s.setGithubPat);
  const setGithubUsername = useStore((s) => s.setGithubUsername);
  const generatedHtml = useStore((s) => s.generatedHtml);
  const getCurrentBusiness = useStore((s) => s.getCurrentBusiness);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const currentBusinessId = useStore((s) => s.currentBusinessId);
  const setPublishedUrl = useStore((s) => s.setPublishedUrl);
  const setPublishedRepoName = useStore((s) => s.setPublishedRepoName);
  const isPublishing = useStore((s) => s.isPublishing);
  const setIsPublishing = useStore((s) => s.setIsPublishing);

  const business = getCurrentBusiness();

  const [patInput, setPatInput] = useState(githubPat || '');
  const [showPat, setShowPat] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [patValid, setPatValid] = useState(!!githubPat);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    if (business) {
      setRepoName(slugify(business.name) + '-website');
    }
  }, [business]);

  if (!business || !generatedHtml) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>No website to publish.</Typography>
        <Button onClick={() => navigate('/preview')} sx={{ mt: 2 }}>Back to Preview</Button>
      </Box>
    );
  }

  const handleValidatePat = async () => {
    try {
      const username = await validatePat(patInput.trim());
      setGithubPat(patInput.trim());
      setGithubUsername(username);
      setPatValid(true);
      setError('');
    } catch {
      setError('Invalid GitHub PAT. Please check and try again.');
      setPatValid(false);
    }
  };

  const handlePublish = async () => {
    if (!patValid || !repoName.trim()) return;

    setIsPublishing(true);
    setError('');

    try {
      const pat = githubPat;
      const owner = githubUsername;
      let repo = repoName.trim();

      // Step 1: Create repo
      setStatusText('Creating GitHub repository...');
      try {
        await createRepo(pat, repo);
      } catch (err) {
        if (err.message === 'REPO_EXISTS') {
          // Try alternative names
          const alternatives = [`${repo}-2`, `${repo}-web`, `${repo}-site`];
          let created = false;
          for (const alt of alternatives) {
            try {
              await createRepo(pat, alt);
              repo = alt;
              setRepoName(alt);
              created = true;
              break;
            } catch {
              continue;
            }
          }
          if (!created) {
            throw new Error('Repository name already exists. Please choose a different name.');
          }
        } else {
          throw err;
        }
      }

      // Step 2: Download photos, upload to repo, and strip API keys from HTML
      setStatusText('Processing photos...');
      const cleanHtml = await processPhotosForPublish(pat, owner, repo, generatedHtml);

      // Step 3: Upload index.html (with local photo paths, no API keys)
      setStatusText('Uploading website files...');
      await uploadFile(pat, owner, repo, 'index.html', cleanHtml, 'Add website');

      // Step 4: Enable GitHub Pages
      setStatusText('Enabling GitHub Pages...');
      try {
        await enablePages(pat, owner, repo);
      } catch {
        // Pages might auto-enable, continue
      }

      // Step 5: Wait for deployment
      setStatusText('Waiting for site to go live...');
      const liveUrl = await waitForPages(pat, owner, repo);

      setPublishedUrl(liveUrl);
      setPublishedRepoName(repo);
      updateBusiness(currentBusinessId, {
        generatedUrl: liveUrl,
        status: 'in_progress',
      });

      navigate('/live');
    } catch (err) {
      setError(err.message);
      setSnackbar(err.message);
    } finally {
      setIsPublishing(false);
      setStatusText('');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
        Publish to GitHub
      </Typography>

      {/* Pre-publish checklist */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Pre-publish Checklist
          </Typography>

          <Stack spacing={2}>
            {/* GitHub PAT */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {patValid ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <ErrorIcon color="error" fontSize="small" />
              )}
              <Typography variant="body2" sx={{ flex: 1 }}>
                GitHub PAT configured
              </Typography>
            </Box>

            {!patValid && (
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="GitHub Personal Access Token"
                  type={showPat ? 'text' : 'password'}
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  sx={{ mb: 1 }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label={showPat ? 'Hide' : 'Show'}
                            onClick={() => setShowPat(!showPat)}
                          >
                            {showPat ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button size="small" variant="outlined" onClick={handleValidatePat}>
                  Validate & Save
                </Button>
              </Box>
            )}

            {/* GitHub username */}
            {patValid && githubUsername && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">
                  Username: <strong>{githubUsername}</strong>
                </Typography>
              </Box>
            )}

            {/* Repo name */}
            <Box>
              <TextField
                fullWidth
                size="small"
                label="Repository name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
              />
            </Box>

            {/* Branch */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="main" size="small" variant="outlined" />
              <Typography variant="caption" color="text.secondary">Branch (fixed)</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isPublishing && statusText && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            {statusText}
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handlePublish}
        disabled={!patValid || !repoName.trim() || isPublishing}
        sx={{ py: 1.5 }}
      >
        {isPublishing ? 'Publishing...' : 'Publish'}
      </Button>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={6000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}
