import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LanguageIcon from '@mui/icons-material/Language';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import useStore from '../store/useStore';
import { searchBusinesses, calculateScore, getScoreLabel } from '../services/googlePlaces';

export default function Discovery() {
  const navigate = useNavigate();
  const lastCity = useStore((s) => s.lastCity);
  const searchedCity = useStore((s) => s.searchedCity);
  const setSearchedCity = useStore((s) => s.setSearchedCity);
  const businesses = useStore((s) => s.businesses);
  const setBusinesses = useStore((s) => s.setBusinesses);
  const setCurrentBusinessId = useStore((s) => s.setCurrentBusinessId);
  const isSearching = useStore((s) => s.isSearching);
  const setIsSearching = useStore((s) => s.setIsSearching);
  const resetWizard = useStore((s) => s.resetWizard);

  const [refreshDialog, setRefreshDialog] = useState(false);
  const [error, setError] = useState('');

  const fetchBusinesses = async (force = false) => {
    if (!lastCity) return;

    // Only skip fetch if we already have results for THIS city and not forcing
    const isSameCity = lastCity === searchedCity;
    if (isSameCity && businesses.length > 0 && !force) return;

    setIsSearching(true);
    setError('');
    try {
      const results = await searchBusinesses(lastCity);
      const scored = results.map((b) => ({
        ...b,
        score: calculateScore(b),
      }));
      scored.sort((a, b) => b.score - a.score);

      if (force && isSameCity) {
        // Same city refresh: keep completed businesses, merge new ones
        const completed = businesses.filter((b) => b.status === 'completed');
        const completedIds = new Set(completed.map((b) => b.place_id));
        const newOnes = scored.filter((b) => !completedIds.has(b.place_id));
        setBusinesses([...completed, ...newOnes].sort((a, b) => b.score - a.score));
      } else {
        // New city: replace all businesses
        setBusinesses(scored);
      }
      setSearchedCity(lastCity);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [lastCity]);

  const handleRefresh = () => {
    if (businesses.length > 0) {
      setRefreshDialog(true);
    } else {
      fetchBusinesses(true);
    }
  };

  const confirmRefresh = () => {
    setRefreshDialog(false);
    fetchBusinesses(true);
  };

  const handleGenerate = (business) => {
    setCurrentBusinessId(business.place_id);
    resetWizard();
    navigate('/wizard');
  };

  if (isSearching) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 3,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Searching Google for businesses in {lastCity}...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => fetchBusinesses(true)}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>
            {lastCity}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {businesses.length} businesses found without a website
          </Typography>
        </Box>
        <IconButton aria-label="Refresh search results" onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Business cards */}
      <Stack spacing={2} sx={{ mt: 2 }}>
        {businesses.map((biz) => {
          const scoreInfo = getScoreLabel(biz.score);
          const isCompleted = biz.status === 'completed';

          return (
            <Card
              key={biz.place_id}
              sx={{
                position: 'relative',
                opacity: isCompleted ? 0.85 : 1,
                ...(isCompleted && {
                  border: '2px solid',
                  borderColor: 'success.main',
                  bgcolor: 'action.hover',
                }),
              }}
            >
              {isCompleted && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}
                >
                  <CheckCircleIcon color="success" fontSize="small" />
                </Box>
              )}
              <CardContent>
                {/* Name + Score */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600, flex: 1, pr: 1 }}>
                    {biz.name}
                  </Typography>
                  <Chip
                    label={`${scoreInfo.emoji} ${biz.score}`}
                    size="small"
                    sx={{
                      bgcolor: scoreInfo.color,
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {/* Category chip */}
                {biz.category && (
                  <Chip label={biz.category} size="small" variant="outlined" sx={{ mb: 1, mr: 1 }} />
                )}

                {/* Rating + Photos */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  {biz.rating > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Rating value={biz.rating} precision={0.1} size="small" readOnly />
                      <Typography variant="caption" color="text.secondary">
                        ({biz.reviewCount})
                      </Typography>
                    </Box>
                  )}
                  {biz.photoCount > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhotoCameraIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {biz.photoCount}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Indicator row: social, booking, no website */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                  {/* No website badge - always shown */}
                  <Chip
                    icon={<LanguageIcon />}
                    label="No website"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />

                  {/* Social media indicators (clickable links) */}
                  {biz.instagramUrl && (
                    <Chip
                      icon={<InstagramIcon />}
                      label="Instagram"
                      size="small"
                      variant="outlined"
                      component="a"
                      href={biz.instagramUrl}
                      target="_blank"
                      clickable
                    />
                  )}
                  {biz.facebookUrl && (
                    <Chip
                      icon={<FacebookIcon />}
                      label="Facebook"
                      size="small"
                      variant="outlined"
                      component="a"
                      href={biz.facebookUrl}
                      target="_blank"
                      clickable
                    />
                  )}
                  {biz.contactWebsite && (
                    <Chip
                      icon={<LanguageIcon />}
                      label="Website found"
                      size="small"
                      color="success"
                      variant="outlined"
                      component="a"
                      href={biz.contactWebsite}
                      target="_blank"
                      clickable
                    />
                  )}

                  {/* Booking link indicator */}
                  {biz.hasBookingLink && (
                    <Chip icon={<BookOnlineIcon />} label="Booking" size="small" color="info" variant="outlined" />
                  )}
                </Box>

                {/* Contact status */}
                <Box sx={{ mb: 1.5 }}>
                  {biz.email && biz.emailConfidence === 'confirmed' ? (
                    <Chip
                      icon={<MarkEmailReadIcon />}
                      label={biz.email}
                      size="small"
                      color="success"
                    />
                  ) : biz.email && biz.emailConfidence === 'probable' ? (
                    <Chip
                      icon={<MarkEmailReadIcon />}
                      label={`~${biz.email}`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ) : (biz.facebookUrl || biz.instagramUrl || biz.contactWebsite) ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="No email — reachable via links above"
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<WarningIcon />}
                      label="No contact info found"
                      size="small"
                      color="warning"
                    />
                  )}
                </Box>

                {/* Action button */}
                <Box sx={{ mt: 1 }}>
                  {isCompleted ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Website Created"
                      color="success"
                      variant="filled"
                    />
                  ) : biz.status === 'in_progress' ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleGenerate(biz)}
                    >
                      Resume
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleGenerate(biz)}
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                      }}
                    >
                      Generate Website
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {businesses.length === 0 && !isSearching && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="body1" color="text.secondary">
            No businesses without websites found in {lastCity}.
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/')}>
            Try another city
          </Button>
        </Box>
      )}

      {/* Refresh confirmation dialog */}
      <Dialog open={refreshDialog} onClose={() => setRefreshDialog(false)}>
        <DialogTitle>Refresh results for {lastCity}?</DialogTitle>
        <DialogContent>
          <Typography>
            This will re-fetch businesses but keep your completed ones.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefreshDialog(false)}>Cancel</Button>
          <Button onClick={confirmRefresh} variant="contained">
            Refresh
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
