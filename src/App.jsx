import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import getTheme from './theme/theme';
import useStore from './store/useStore';
import AppShell from './components/AppShell';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Discovery from './screens/Discovery';
import ThemeWizard from './screens/ThemeWizard';
import ThemeSummary from './screens/ThemeSummary';
import WebsitePreview from './screens/WebsitePreview';
import GitHubPublish from './screens/GitHubPublish';
import LiveUrl from './screens/LiveUrl';

export default function App() {
  const darkMode = useStore((s) => s.darkMode);
  const onboardingComplete = useStore((s) => s.onboardingComplete);
  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {!onboardingComplete ? (
            <Route path="*" element={<Onboarding />} />
          ) : (
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/discovery" element={<Discovery />} />
              <Route path="/wizard" element={<ThemeWizard />} />
              <Route path="/summary" element={<ThemeSummary />} />
              <Route path="/preview" element={<WebsitePreview />} />
              <Route path="/publish" element={<GitHubPublish />} />
              <Route path="/live" element={<LiveUrl />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
