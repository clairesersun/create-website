import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Snackbar,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import useStore from '../store/useStore';
import { generateOutreachEmail } from '../services/claude';

export default function LiveUrl() {
  const navigate = useNavigate();
  const publishedUrl = useStore((s) => s.publishedUrl);
  const getCurrentBusiness = useStore((s) => s.getCurrentBusiness);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const currentBusinessId = useStore((s) => s.currentBusinessId);
  const userName = useStore((s) => s.userName);
  const lastCity = useStore((s) => s.lastCity);

  const business = getCurrentBusiness();

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    if (business && publishedUrl) {
      generateEmail();
    }
  }, []);

  const getDefaultBody = () => {
    const name = (userName || 'Claire Sersun').split(' ')[0];
    return `Hi there,

I'm ${name}, a web designer based in ${lastCity}. I noticed ${business?.name} didn't have a website, so I went ahead and built one for you :)

You can check it out here:
${publishedUrl}

If you like it, I can help you get it live on your own domain or customize anything to fit your business. If not, no worries at all.

Either way, I just wanted to share it. I love supporting local spots around ${lastCity}.

Would love to hear what you think!

${name}
https://webdesign-portfolio-three.vercel.app/`;
  };

  const generateEmail = async () => {
    if (!business) return;
    setLoadingEmail(true);
    try {
      const email = await generateOutreachEmail(
        userName || 'Claire Sersun',
        business.name,
        lastCity,
        publishedUrl,
        '',
        business.email || ''
      );
      setEmailTo(email.to || business.email || '');
      setEmailSubject(email.subject || `I built a website for ${business.name}`);
      setEmailBody(email.body || getDefaultBody());
    } catch {
      setEmailTo(business.email || '');
      setEmailSubject(`I built a website for ${business.name}`);
      setEmailBody(getDefaultBody());
    } finally {
      setLoadingEmail(false);
    }
  };

  const copyFullEmail = () => {
    const full = `To: ${emailTo}\nSubject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(full);
    setSnackbar('Full email copied to clipboard!');
  };

  const copyBodyOnly = () => {
    navigator.clipboard.writeText(emailBody);
    setSnackbar('Email body copied to clipboard!');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publishedUrl);
    setSnackbar('URL copied to clipboard!');
  };

  const handleDone = () => {
    updateBusiness(currentBusinessId, { status: 'completed' });
    navigate('/');
  };

  if (!business || !publishedUrl) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>No published website found.</Typography>
        <Button onClick={() => navigate('/discovery')} sx={{ mt: 2 }}>Back to Discovery</Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Success header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircleIcon
          sx={{
            fontSize: 64,
            color: 'success.main',
            mb: 1,
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'scaleIn 0.5s ease-out',
            },
            '@keyframes scaleIn': {
              '0%': { transform: 'scale(0)', opacity: 0 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        />
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 1 }}>
          Your website is live!
        </Typography>
        <Chip
          label={publishedUrl}
          clickable
          component="a"
          href={publishedUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          sx={{ mb: 2, maxWidth: '100%' }}
        />
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Website
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={copyUrl}
          >
            Copy URL
          </Button>
        </Stack>
      </Box>

      {/* Email draft */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', mb: 2 }}>
            Outreach Email Draft
          </Typography>

          {loadingEmail ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">Generating personalized email...</Typography>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                variant="outlined"
                label="To"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Enter email address"
              />
              <TextField
                fullWidth
                variant="outlined"
                label="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                variant="outlined"
                label="Body"
                multiline
                rows={10}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Stack direction="row" spacing={1}>
                <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={copyFullEmail}>
                  Copy Full Email
                </Button>
                <Button variant="outlined" onClick={copyBodyOnly}>
                  Copy Body Only
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      {/* Done button */}
      <Button
        variant="outlined"
        size="large"
        fullWidth
        onClick={handleDone}
        sx={{ mt: 3, py: 1.5 }}
      >
        Done
      </Button>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}
