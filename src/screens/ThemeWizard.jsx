import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Slider,
  LinearProgress,
  Card,
  CardContent,
  RadioGroup,
  Radio,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
} from '@mui/material';
import useStore from '../store/useStore';
import { generateColorPalette, generateFontPairing, suggestMoodForCategory } from '../services/claude';

const MOOD_WORDS = [
  'Trustworthy', 'Energetic', 'Calm', 'Bold', 'Playful',
  'Luxurious', 'Earthy', 'Clean', 'Warm', 'Cool',
];

const CURATED_HEADING_FONTS = [
  'Playfair Display', 'Bebas Neue', 'Montserrat', 'Poppins', 'Raleway',
  'Oswald', 'Merriweather', 'Lora', 'Roboto Slab', 'PT Serif',
  'Cormorant Garamond', 'Archivo Black', 'Space Grotesk', 'Inter',
  'Outfit', 'Crimson Text', 'Josefin Sans', 'Bitter', 'Nunito', 'Libre Baskerville',
];

const CURATED_BODY_FONTS = [
  'DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans 3',
  'Nunito Sans', 'Work Sans', 'IBM Plex Sans', 'Karla', 'Mulish',
  'Public Sans', 'Cabin', 'Barlow', 'Rubik', 'Manrope', 'Figtree',
  'Albert Sans', 'Plus Jakarta Sans', 'Lexend',
];

// Slider uses 0–5 index; map to actual px values
const RADIUS_VALUES = [0, 4, 8, 16, 24, 9999];
const RADIUS_MARKS = [
  { value: 0, label: 'Sharp' },
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5, label: 'Pill' },
];

export default function ThemeWizard() {
  const navigate = useNavigate();
  const getCurrentBusiness = useStore((s) => s.getCurrentBusiness);
  const wizardData = useStore((s) => s.wizardData);
  const setWizardData = useStore((s) => s.setWizardData);
  const setWizardStep = useStore((s) => s.setWizardStep);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const currentBusinessId = useStore((s) => s.currentBusinessId);
  const lastCity = useStore((s) => s.lastCity);

  const business = getCurrentBusiness();
  const step = wizardData.step;

  const [loading, setLoading] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [tempColor, setTempColor] = useState('');

  // Initialize mood suggestions on step 2
  useEffect(() => {
    if (step === 2 && wizardData.moodWords.length === 0 && business) {
      suggestMoodForCategory(business.category).then((moods) => {
        setWizardData({ moodWords: moods });
      });
    }
  }, [step]);

  if (!business) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>No business selected.</Typography>
        <Button onClick={() => navigate('/discovery')} sx={{ mt: 2 }}>
          Back to Discovery
        </Button>
      </Box>
    );
  }

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const goNext = () => setWizardStep(Math.min(step + 1, totalSteps));
  const goBack = () => {
    if (step === 1) {
      navigate('/discovery');
    } else {
      setWizardStep(step - 1);
    }
  };

  const handleMoodToggle = (mood) => {
    const current = wizardData.moodWords;
    if (current.includes(mood)) {
      setWizardData({ moodWords: current.filter((m) => m !== mood) });
    } else if (current.length < 2) {
      setWizardData({ moodWords: [...current, mood] });
    } else {
      setWizardData({ moodWords: [current[0], mood] });
    }
  };

  const handleGeneratePalette = async () => {
    setLoading(true);
    try {
      const colors = await generateColorPalette(
        business.category,
        business.name,
        lastCity,
        wizardData.moodWords.length > 0 ? wizardData.moodWords : ['Clean', 'Trustworthy']
      );
      setWizardData({ colors });
    } catch (err) {
      console.error('Failed to generate palette:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFonts = async () => {
    setLoading(true);
    try {
      const fonts = await generateFontPairing(
        business.category,
        wizardData.moodWords.length > 0 ? wizardData.moodWords : ['Clean', 'Trustworthy']
      );
      setWizardData({ headingFont: fonts.heading, bodyFont: fonts.body });
    } catch (err) {
      console.error('Failed to generate fonts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Next = async () => {
    setLoading(true);
    try {
      const [colors, fonts] = await Promise.all([
        generateColorPalette(
          business.category,
          business.name,
          lastCity,
          wizardData.moodWords.length > 0 ? wizardData.moodWords : ['Clean', 'Trustworthy']
        ),
        generateFontPairing(
          business.category,
          wizardData.moodWords.length > 0 ? wizardData.moodWords : ['Clean', 'Trustworthy']
        ),
      ]);
      setWizardData({ colors, headingFont: fonts.heading, bodyFont: fonts.body });
      goNext();
    } catch (err) {
      console.error('Failed to generate theme:', err);
      goNext();
    } finally {
      setLoading(false);
    }
  };

  const openColorPicker = (colorKey) => {
    setEditingColor(colorKey);
    setTempColor(wizardData.colors[colorKey]);
    setColorPickerOpen(true);
  };

  const saveColor = () => {
    if (editingColor && tempColor) {
      setWizardData({
        colors: { ...wizardData.colors, [editingColor]: tempColor },
      });
    }
    setColorPickerOpen(false);
  };

  const goToSummary = () => {
    updateBusiness(currentBusinessId, {
      status: 'in_progress',
      themeData: { ...wizardData },
    });
    navigate('/summary');
  };

  return (
    <Box>
      {/* Progress bar */}
      <LinearProgress variant="determinate" value={progress} sx={{ mb: 1, borderRadius: 4 }} />
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Step {step} of {totalSteps}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {business.name}
      </Typography>

      {/* Step 1: Business Context */}
      {step === 1 && (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
            Here's what we know about this business.
          </Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">{business.name}</Typography>
              <Typography variant="body2" color="text.secondary">{business.category}</Typography>
              <Typography variant="body2" color="text.secondary">{lastCity}</Typography>
              {business.reviewCount > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {business.reviewCount} reviews ({business.rating} stars)
                </Typography>
              )}
              {business.photoCount > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {business.photoCount} photos
                </Typography>
              )}
              {business.phone && (
                <Typography variant="body2" color="text.secondary">
                  {business.phone}
                </Typography>
              )}
              {business.socialLinks?.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Social: {business.socialLinks.join(', ')}
                </Typography>
              )}
            </CardContent>
          </Card>
          <TextField
            fullWidth
            variant="outlined"
            label="Anything to add or correct?"
            multiline
            rows={2}
            value={wizardData.context.additionalInfo || ''}
            onChange={(e) =>
              setWizardData({ context: { ...wizardData.context, additionalInfo: e.target.value } })
            }
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="text" onClick={goBack}>← Back</Button>
            <Button variant="contained" onClick={goNext}>Looks good →</Button>
          </Box>
        </Box>
      )}

      {/* Step 2: Color Mood */}
      {step === 2 && (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
            What feeling should this website give visitors?
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {MOOD_WORDS.map((mood) => (
              <Chip
                key={mood}
                label={mood}
                onClick={() => handleMoodToggle(mood)}
                color={wizardData.moodWords.includes(mood) ? 'primary' : 'default'}
                variant={wizardData.moodWords.includes(mood) ? 'filled' : 'outlined'}
                clickable
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Or describe it in your own words:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={wizardData.customMood}
            onChange={(e) => setWizardData({ customMood: e.target.value })}
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="text" onClick={goBack}>← Back</Button>
            <Button
              variant="contained"
              onClick={handleStep2Next}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Generating...' : 'Next →'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Color Palette */}
      {step === 3 && (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
            Here's your recommended color palette.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['primary', 'secondary', 'neutral', 'light', 'dark'].map((key) => (
              <Box
                key={key}
                sx={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => openColorPicker(key)}
                role="button"
                tabIndex={0}
                aria-label={`Edit ${key} color: ${wizardData.colors[key]}`}
                onKeyDown={(e) => e.key === 'Enter' && openColorPicker(key)}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    bgcolor: wizardData.colors[key],
                    border: '2px solid',
                    borderColor: 'divider',
                    mb: 0.5,
                  }}
                />
                <Typography variant="caption" sx={{ textTransform: 'capitalize', display: 'block' }}>
                  {key === 'secondary' ? 'Accent' : key}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                  {wizardData.colors[key]}
                </Typography>
              </Box>
            ))}
          </Box>
          <Button variant="text" size="small" onClick={handleGeneratePalette} disabled={loading} sx={{ mb: 3 }}>
            {loading ? 'Regenerating...' : 'Regenerate palette'}
          </Button>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="text" onClick={goBack}>← Back</Button>
            <Button variant="contained" onClick={goNext}>Next →</Button>
          </Box>
        </Box>
      )}

      {/* Step 4: Typography */}
      {step === 4 && (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
            Choose your fonts.
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Heading Font
            </Typography>
            <Chip label="AI Recommended" size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
            <link
              href={`https://fonts.googleapis.com/css2?family=${wizardData.headingFont.replace(/ /g, '+')}&display=swap`}
              rel="stylesheet"
            />
            <Typography
              variant="h5"
              sx={{ fontFamily: `"${wizardData.headingFont}", serif`, mb: 1.5 }}
            >
              Welcome to {business.name}
            </Typography>
            <TextField
              select
              fullWidth
              variant="outlined"
              size="small"
              label="Change heading font"
              value={wizardData.headingFont}
              onChange={(e) => setWizardData({ headingFont: e.target.value })}
              slotProps={{ select: { native: true } }}
            >
              {CURATED_HEADING_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </TextField>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Body Font
            </Typography>
            <Chip label="AI Recommended" size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
            <link
              href={`https://fonts.googleapis.com/css2?family=${wizardData.bodyFont.replace(/ /g, '+')}&display=swap`}
              rel="stylesheet"
            />
            <Typography
              variant="body1"
              sx={{ fontFamily: `"${wizardData.bodyFont}", sans-serif`, mb: 1.5 }}
            >
              We're open Monday–Saturday, 9am to 6pm. Call us anytime.
            </Typography>
            <TextField
              select
              fullWidth
              variant="outlined"
              size="small"
              label="Change body font"
              value={wizardData.bodyFont}
              onChange={(e) => setWizardData({ bodyFont: e.target.value })}
              slotProps={{ select: { native: true } }}
            >
              {CURATED_BODY_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </TextField>
          </Box>

          <Button variant="text" size="small" onClick={handleGenerateFonts} disabled={loading} sx={{ mb: 2 }}>
            {loading ? 'Regenerating...' : 'Get AI suggestions'}
          </Button>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="text" onClick={goBack}>← Back</Button>
            <Button variant="contained" onClick={goNext}>Next →</Button>
          </Box>
        </Box>
      )}

      {/* Step 5: Button Style */}
      {step === 5 && (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
            How should your buttons look?
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Primary Button Color</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {['primary', 'secondary', 'neutral', 'light', 'dark'].map((key) => (
              <Box
                key={key}
                onClick={() => setWizardData({ buttonColor: key })}
                role="button"
                tabIndex={0}
                aria-label={`Select ${key} as button color`}
                onKeyDown={(e) => e.key === 'Enter' && setWizardData({ buttonColor: key })}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: wizardData.colors[key],
                  border: wizardData.buttonColor === key ? '3px solid' : '2px solid',
                  borderColor: wizardData.buttonColor === key ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              />
            ))}
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Border Radius</Typography>
          <Slider
            value={RADIUS_VALUES.indexOf(wizardData.buttonRadius) !== -1 ? RADIUS_VALUES.indexOf(wizardData.buttonRadius) : 2}
            min={0}
            max={5}
            step={1}
            marks={RADIUS_MARKS}
            onChange={(_, idx) => setWizardData({ buttonRadius: RADIUS_VALUES[idx] })}
            sx={{ mb: 3, maxWidth: 300 }}
            aria-label="Button border radius"
          />

          {/* Live preview */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              sx={{
                borderRadius: wizardData.buttonRadius >= 9999 ? '9999px' : `${wizardData.buttonRadius}px`,
                bgcolor: wizardData.colors[wizardData.buttonColor],
                color: ['light', 'neutral'].includes(wizardData.buttonColor) ? wizardData.colors.dark : '#fff',
                '&:hover': { bgcolor: wizardData.colors[wizardData.buttonColor], opacity: 0.9 },
              }}
            >
              Book Now
            </Button>
            <Button
              variant="outlined"
              sx={{
                borderRadius: wizardData.buttonRadius >= 9999 ? '9999px' : `${wizardData.buttonRadius}px`,
                borderColor: wizardData.colors[wizardData.buttonColor],
                color: wizardData.colors[wizardData.buttonColor],
              }}
            >
              Contact Us
            </Button>
          </Stack>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="text" onClick={goBack}>← Back</Button>
            <Button variant="contained" onClick={goNext}>Next →</Button>
          </Box>
        </Box>
      )}

      {/* Step 6: Background & Mode */}
      {step === 6 && (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Outfit", sans-serif' }}>
            What's the overall look and feel?
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Background Style</Typography>
          <RadioGroup
            value={wizardData.backgroundMode}
            onChange={(e) => setWizardData({ backgroundMode: e.target.value })}
            sx={{ mb: 3 }}
          >
            <FormControlLabel value="light" control={<Radio />} label="Light — White/light surfaces, dark text" />
            <FormControlLabel value="dark" control={<Radio />} label="Dark — Dark surfaces, light text" />
            <FormControlLabel value="auto" control={<Radio />} label="Auto — Respects visitor's system preference (recommended)" />
          </RadioGroup>

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Primary Background Tone</Typography>
          <ToggleButtonGroup
            value={wizardData.backgroundTone}
            exclusive
            onChange={(_, val) => val && setWizardData({ backgroundTone: val })}
            sx={{ mb: 3 }}
          >
            <ToggleButton value="neutral">Neutral</ToggleButton>
            <ToggleButton value="tinted">Tinted</ToggleButton>
            <ToggleButton value="bold">Bold</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 3 }}>
            <Button variant="text" onClick={goBack}>← Back</Button>
            <Button variant="contained" onClick={goToSummary}>Next →</Button>
          </Box>
        </Box>
      )}

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
