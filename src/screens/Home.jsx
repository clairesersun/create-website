import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useStore from '../store/useStore';

export default function Home() {
  const navigate = useNavigate();
  const lastCity = useStore((s) => s.lastCity);
  const setLastCity = useStore((s) => s.setLastCity);
  const [city, setCity] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const searchCity = city.trim();
    if (!searchCity) return;
    setLastCity(searchCity);
    navigate('/discovery');
  };

  const handleResume = () => {
    navigate('/discovery');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        textAlign: 'center',
      }}
    >
      {/* App wordmark */}
      <Typography
        variant="subtitle1"
        sx={{
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 600,
          letterSpacing: 1,
          color: 'primary.main',
          mb: 2,
          textTransform: 'uppercase',
          fontSize: '0.85rem',
        }}
      >
        Web Prospector
      </Typography>

      {/* H1: Main heading */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 700,
          mb: 4,
        }}
      >
        Find local businesses that need a website.
      </Typography>

      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{ width: '100%', maxWidth: 400 }}
      >
        <TextField
          fullWidth
          variant="outlined"
          inputRef={inputRef}
          placeholder="Enter a city (e.g. Brookfield, WI)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<SearchIcon />}
          disabled={!city.trim()}
        >
          Search Businesses
        </Button>
      </Box>

      {lastCity && (
        <Chip
          icon={<SearchIcon fontSize="small" />}
          label={`Last searched: ${lastCity} — tap to resume`}
          onClick={handleResume}
          sx={{ mt: 3 }}
          variant="outlined"
          clickable
        />
      )}
    </Box>
  );
}
