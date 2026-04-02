import { createTheme } from '@mui/material/styles';

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#4A6CF7',
      },
      secondary: {
        main: '#7C5CFC',
      },
      background: {
        default: mode === 'light' ? '#FFFBFE' : '#1C1B1F',
        paper: mode === 'light' ? '#FFFFFF' : '#2B2930',
      },
      surface: {
        main: mode === 'light' ? '#FFFBFE' : '#1C1B1F',
        variant: mode === 'light' ? '#E7E0EC' : '#49454F',
      },
      error: {
        main: '#B3261E',
      },
      success: {
        main: '#2E7D32',
      },
      warning: {
        main: '#ED6C02',
      },
    },
    typography: {
      fontFamily: '"DM Sans", sans-serif',
      h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
      h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 500 },
      subtitle1: { fontFamily: '"DM Sans", sans-serif', fontWeight: 500 },
      subtitle2: { fontFamily: '"DM Sans", sans-serif', fontWeight: 500 },
      body1: { fontFamily: '"DM Sans", sans-serif' },
      body2: { fontFamily: '"DM Sans", sans-serif' },
      button: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600, textTransform: 'none' },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 24px',
            fontSize: '0.95rem',
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'light'
              ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
              : '0 1px 3px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
          },
        },
      },
    },
  });

export default getTheme;
