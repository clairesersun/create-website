import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import useStore from '../store/useStore';
import { generateWebsiteHtml } from '../services/claude';

export default function ThemeSummary() {
  const navigate = useNavigate();
  const wizardData = useStore((s) => s.wizardData);
  const setWizardStep = useStore((s) => s.setWizardStep);
  const getCurrentBusiness = useStore((s) => s.getCurrentBusiness);
  const generatedHtml = useStore((s) => s.generatedHtml);
  const setGeneratedHtml = useStore((s) => s.setGeneratedHtml);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const currentBusinessId = useStore((s) => s.currentBusinessId);
  const lastCity = useStore((s) => s.lastCity);
  const isGenerating = useStore((s) => s.isGenerating);
  const setIsGenerating = useStore((s) => s.setIsGenerating);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [tempColor, setTempColor] = useState('');
  const [generateError, setGenerateError] = useState(null);

  const business = getCurrentBusiness();

  if (!business) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>No business selected.</Typography>
        <Button onClick={() => navigate('/discovery')} sx={{ mt: 2 }}>Back to Discovery</Button>
      </Box>
    );
  }

  const editStep = (stepNum) => {
    setWizardStep(stepNum);
    navigate('/wizard');
  };

  const openColorPicker = (colorKey) => {
    setEditingColor(colorKey);
    setTempColor(wizardData.colors[colorKey]);
    setColorPickerOpen(true);
  };

  const saveColor = () => {
    if (editingColor && tempColor) {
      useStore.getState().setWizardData({
        colors: { ...wizardData.colors, [editingColor]: tempColor },
      });
    }
    setColorPickerOpen(false);
  };

  const currentThemeData = {
    colors: wizardData.colors,
    headingFont: wizardData.headingFont,
    bodyFont: wizardData.bodyFont,
    buttonRadius: wizardData.buttonRadius,
    buttonColor: wizardData.buttonColor,
    backgroundMode: wizardData.backgroundMode,
    backgroundTone: wizardData.backgroundTone,
    moodWords: wizardData.moodWords,
    includeGallery: wizardData.includeGallery,
  };

  // Check if theme has changed since last generation
  const hasExistingHtml = !!generatedHtml;
  const themeUnchanged = hasExistingHtml && business.themeData &&
    JSON.stringify(currentThemeData) === JSON.stringify(business.themeData);

  const handleGenerate = async () => {
    // If nothing changed and we already have HTML, just go to preview
    if (themeUnchanged) {
      navigate('/preview');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    try {
      // Only include fields that actually have data
      const businessData = {
        name: business.name,
        category: business.category,
        city: lastCity,
      };
      if (business.rating) businessData.rating = business.rating;
      if (business.reviewCount) businessData.reviewCount = business.reviewCount;
      if (business.phone) businessData.phone = business.phone;
      if (business.address) businessData.address = business.address;
      if (business.hours?.length > 0) businessData.hours = business.hours;
      if (business.socialLinks?.length > 0) businessData.socialLinks = business.socialLinks;
      if (business.hasBookingLink) businessData.hasBookingLink = true;
      if (business.email) businessData.email = business.email;
      if (business.photos?.length > 0) {
        businessData.photos = business.photos;
        businessData.gallery = wizardData.includeGallery === true;
      }
      if (wizardData.context?.additionalInfo?.trim()) {
        businessData.additionalContext = wizardData.context.additionalInfo.trim();
      }

      console.log('[ThemeSummary] businessData being sent to Claude:', JSON.stringify(businessData, null, 2));
      const html = await generateWebsiteHtml(businessData, currentThemeData);
      setGeneratedHtml(html);
      updateBusiness(currentBusinessId, {
        status: 'in_progress',
        themeData: currentThemeData,
        generatedHtml: html,
      });
      navigate('/preview');
    } catch (err) {
      console.error('Failed to generate website:', err);
      const message = err.message || 'Unknown error';
      if (message.includes('504') || message.includes('FUNCTION_INVOCATION_TIMEOUT')) {
        setGenerateError('The request timed out. The website generation took too long — please try again.');
      } else if (message.includes('529') || message.includes('overloaded')) {
        setGenerateError('The AI service is currently overloaded. Please wait a minute and try again.');
      } else if (message.includes('500')) {
        setGenerateError('Server error. Please try again in a moment.');
      } else {
        setGenerateError(`Failed to generate website: ${message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const colorLabels = {
    primary: 'Primary',
    secondary: 'Accent',
    neutral: 'Neutral',
    light: 'Light',
    dark: 'Dark',
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
        Theme Summary
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your choices for {business.name}
      </Typography>

      {/* Colors Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>Colors</Typography>
            <IconButton size="small" aria-label="Edit colors" onClick={() => editStep(3)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {['primary', 'secondary', 'neutral', 'light', 'dark'].map((key) => (
              <Box key={key} sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => openColorPicker(key)}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: wizardData.colors[key],
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 0.5,
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', display: 'block' }}>
                  {colorLabels[key]}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Typography Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>Typography</Typography>
            <IconButton size="small" aria-label="Edit typography" onClick={() => editStep(4)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          {/* Load fonts for preview */}
          <link
            href={`https://fonts.googleapis.com/css2?family=${wizardData.headingFont.replace(/ /g, '+')}&display=swap`}
            rel="stylesheet"
          />
          <link
            href={`https://fonts.googleapis.com/css2?family=${wizardData.bodyFont.replace(/ /g, '+')}&display=swap`}
            rel="stylesheet"
          />
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Heading: {wizardData.headingFont}</Typography>
            <Typography
              variant="h6"
              sx={{ fontFamily: `"${wizardData.headingFont}", serif`, mt: 0.5 }}
            >
              Welcome to {business.name}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Body: {wizardData.bodyFont}</Typography>
            <Typography
              variant="body1"
              sx={{ fontFamily: `"${wizardData.bodyFont}", sans-serif`, mt: 0.5 }}
            >
              We're open Monday–Saturday, 9am to 6pm.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Buttons Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>Buttons</Typography>
            <IconButton size="small" aria-label="Edit button style" onClick={() => editStep(5)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              size="small"
              sx={{
                borderRadius: wizardData.buttonRadius >= 9999 ? '9999px' : `${wizardData.buttonRadius}px`,
                bgcolor: wizardData.colors[wizardData.buttonColor],
                color: ['light', 'neutral'].includes(wizardData.buttonColor) ? wizardData.colors.dark : '#fff',
                '&:hover': { bgcolor: wizardData.colors[wizardData.buttonColor] },
              }}
            >
              Primary
            </Button>
            <Button
              variant="outlined"
              size="small"
              sx={{
                borderRadius: wizardData.buttonRadius >= 9999 ? '9999px' : `${wizardData.buttonRadius}px`,
                borderColor: wizardData.colors[wizardData.buttonColor],
                color: wizardData.colors[wizardData.buttonColor],
              }}
            >
              Secondary
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Background Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>Background & Mode</Typography>
            <IconButton size="small" aria-label="Edit background" onClick={() => editStep(6)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label={wizardData.backgroundMode} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
            <Chip label={wizardData.backgroundTone} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
          </Stack>
        </CardContent>
      </Card>

      {/* Photo Gallery Section — only if business has photos */}
      {business.photos?.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoLibraryIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={600}>Photo Gallery</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {business.photos.length} photo{business.photos.length !== 1 ? 's' : ''} available
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 1.5 }}>
              {business.photos.map((url, i) => (
                <Box
                  key={i}
                  component="img"
                  src={url}
                  alt={`${business.name} photo ${i + 1}`}
                  sx={{
                    width: 80,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1,
                    flexShrink: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Include a dedicated gallery section on the website?
            </Typography>
            <ToggleButtonGroup
              value={wizardData.includeGallery === true ? 'yes' : wizardData.includeGallery === false ? 'no' : null}
              exclusive
              onChange={(e, val) => {
                if (val !== null) {
                  useStore.getState().setWizardData({ includeGallery: val === 'yes' });
                }
              }}
              size="small"
            >
              <ToggleButton value="yes">Yes, add gallery</ToggleButton>
              <ToggleButton value="no">No gallery</ToggleButton>
            </ToggleButtonGroup>
            {wizardData.includeGallery === false && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Photos will still be used throughout the page (hero, accents, etc.)
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Business Details Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>Business Details</Typography>
            <IconButton size="small" aria-label="Edit mood" onClick={() => editStep(2)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2">{business.name}</Typography>
          <Typography variant="body2" color="text.secondary">{business.category} · {lastCity}</Typography>
          {wizardData.moodWords.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
              {wizardData.moodWords.map((m) => (
                <Chip key={m} label={m} size="small" color="primary" variant="outlined" />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {generateError && (
        <Alert severity="error" onClose={() => setGenerateError(null)} sx={{ mb: 2 }}>
          {generateError}
        </Alert>
      )}

      {/* Generate Button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleGenerate}
        disabled={isGenerating}
        startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
        sx={{ py: 1.5 }}
      >
        {isGenerating ? 'Generating Website...' : themeUnchanged ? 'View Website' : 'Generate Website'}
      </Button>

      {/* Color Picker Dialog */}
      <Dialog open={colorPickerOpen} onClose={() => setColorPickerOpen(false)}>
        <DialogTitle>Edit Color</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: tempColor,
                border: '2px solid',
                borderColor: 'divider',
              }}
            />
            <TextField
              label="Hex color"
              variant="outlined"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              size="small"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <input
              type="color"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              style={{ width: '100%', height: 40, border: 'none', cursor: 'pointer' }}
              aria-label="Color picker"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColorPickerOpen(false)}>Cancel</Button>
          <Button onClick={saveColor} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
