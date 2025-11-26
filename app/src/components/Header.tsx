
import React, { useRef } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';

import DownloadIcon from '@mui/icons-material/Download';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import MidiDeviceChooser from './MidiDeviceChooser';
import { useIOStore } from '../store/io';

const Header: React.FC = () => {
  const saveToFile = useIOStore((state) => state.saveToFile);
  const loadFromFile = useIOStore((state) => state.loadFromFile);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadFromFile(json);
      } catch (err) {
        console.error('Failed to load JSON', err);
      }
    };
    reader.readAsText(file);
  };

  const handleOpenClick = () => {
    handleUploadClick();
  };

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          enomik 3000
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Download */}
          <IconButton color="inherit" onClick={saveToFile}>
            <DownloadIcon />
          </IconButton>

          {/* Open (load file) */}
          <IconButton color="inherit" onClick={handleOpenClick}>
            <FolderOpenIcon />
          </IconButton>

          {/* Upload (explicit import) */}
          <IconButton color="inherit" onClick={handleUploadClick}>
            <UploadFileIcon />
          </IconButton>

          {/* Hidden file input */}
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <MidiDeviceChooser />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
