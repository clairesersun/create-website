import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import PaletteIcon from '@mui/icons-material/Palette';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';
import useStore from '../store/useStore';
import { reviseWebsiteHtml } from '../services/claude';

export default function WebsitePreview() {
  const navigate = useNavigate();
  const generatedHtml = useStore((s) => s.generatedHtml);
  const setGeneratedHtml = useStore((s) => s.setGeneratedHtml);
  const getCurrentBusiness = useStore((s) => s.getCurrentBusiness);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const currentBusinessId = useStore((s) => s.currentBusinessId);

  const [viewMode, setViewMode] = useState('mobile');
  const [snackbar, setSnackbar] = useState('');
  const [changeRequest, setChangeRequest] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [htmlEditorOpen, setHtmlEditorOpen] = useState(false);
  const [htmlEditorValue, setHtmlEditorValue] = useState('');
  const [htmlHistory, setHtmlHistory] = useState([]);
  const iframeRef = useRef(null);

  const business = getCurrentBusiness();

  if (!generatedHtml || !business) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>No website generated yet.</Typography>
        <Button onClick={() => navigate('/summary')} sx={{ mt: 2 }}>
          Back to Theme Summary
        </Button>
      </Box>
    );
  }

  const openHtmlEditor = () => {
    setHtmlEditorValue(generatedHtml);
    setHtmlEditorOpen(true);
  };

  const saveHtmlEdits = () => {
    setHtmlHistory((prev) => [...prev, generatedHtml]);
    setGeneratedHtml(htmlEditorValue);
    updateBusiness(currentBusinessId, { generatedHtml: htmlEditorValue });
    setHtmlEditorOpen(false);
    setSnackbar('HTML changes saved.');
  };

  const handleUndo = () => {
    if (htmlHistory.length === 0) return;
    const previous = htmlHistory[htmlHistory.length - 1];
    setHtmlHistory((prev) => prev.slice(0, -1));
    setGeneratedHtml(previous);
    updateBusiness(currentBusinessId, { generatedHtml: previous });
    setSnackbar('Change undone.');
  };

  const handleRequestChanges = async () => {
    if (!changeRequest.trim()) return;

    setIsRevising(true);
    try {
      const revisedHtml = await reviseWebsiteHtml(generatedHtml, changeRequest.trim());
      setHtmlHistory((prev) => [...prev, generatedHtml]);
      setGeneratedHtml(revisedHtml);
      updateBusiness(currentBusinessId, { generatedHtml: revisedHtml });
      setChangeRequest('');
      setSnackbar('Changes applied!');
    } catch (err) {
      console.error('Failed to apply changes:', err);
      setSnackbar('Failed to apply changes. Please try again.');
    } finally {
      setIsRevising(false);
    }
  };

  return (
    <Box>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600 }}>
          Website Preview
        </Typography>
        <Box>
          <IconButton
            aria-label="Undo last change"
            onClick={handleUndo}
            disabled={htmlHistory.length === 0}
          >
            <UndoIcon />
          </IconButton>
          <IconButton aria-label="Edit HTML" onClick={openHtmlEditor}>
            <CodeIcon />
          </IconButton>
          <IconButton aria-label="Change theme" onClick={() => navigate('/summary')}>
            <PaletteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* View mode toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, val) => val && setViewMode(val)}
          size="small"
        >
          <ToggleButton value="mobile" aria-label="Mobile view">
            <PhoneIphoneIcon sx={{ mr: 0.5 }} /> Mobile
          </ToggleButton>
          <ToggleButton value="desktop" aria-label="Desktop view">
            <DesktopWindowsIcon sx={{ mr: 0.5 }} /> Desktop
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Preview iframe */}
      <Box
        sx={{
          mx: 'auto',
          width: viewMode === 'mobile' ? 375 : '100%',
          maxWidth: '100%',
          border: viewMode === 'mobile' ? '8px solid' : '4px solid',
          borderColor: 'divider',
          borderRadius: viewMode === 'mobile' ? 4 : 2,
          overflow: 'hidden',
          bgcolor: '#fff',
        }}
      >
        <iframe
          ref={iframeRef}
          title="Website Preview"
          sandbox="allow-scripts"
          srcDoc={generatedHtml}
          style={{
            width: '100%',
            height: viewMode === 'mobile' ? 667 : 600,
            border: 'none',
          }}
        />
      </Box>

      {/* Request changes input */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <AutoFixHighIcon color="primary" sx={{ mt: 1.5 }} />
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          multiline
          maxRows={4}
          placeholder="Describe changes you want (e.g. &quot;Make the hero text bigger&quot;, &quot;Remove the hours section&quot;, &quot;Change the CTA to say Call Now&quot;)"
          value={changeRequest}
          onChange={(e) => setChangeRequest(e.target.value)}
          disabled={isRevising}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleRequestChanges();
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleRequestChanges}
          disabled={!changeRequest.trim() || isRevising}
          sx={{ minWidth: 'auto', px: 2, mt: 0.5 }}
          aria-label="Apply changes"
        >
          {isRevising ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        </Button>
      </Box>
      {isRevising && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 4.5, display: 'block' }}>
          Applying changes...
        </Typography>
      )}

      {/* Publish button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={() => navigate('/publish')}
        sx={{ mt: 2, py: 1.5 }}
      >
        Publish to GitHub
      </Button>

      {/* HTML Editor Dialog */}
      <Dialog open={htmlEditorOpen} onClose={() => setHtmlEditorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit HTML</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={20}
            value={htmlEditorValue}
            onChange={(e) => setHtmlEditorValue(e.target.value)}
            sx={{ mt: 1, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHtmlEditorOpen(false)}>Cancel</Button>
          <Button onClick={saveHtmlEdits} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}
