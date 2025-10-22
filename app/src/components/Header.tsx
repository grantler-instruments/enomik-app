// Header.tsx
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import MidiDeviceChooser from './MidiDeviceChooser';

const Header: React.FC = () => {
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        {/* Left: Menu Icon (for mobile or navigation drawer) */}
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Center: App Title */}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          MyApp
        </Typography>
        <MidiDeviceChooser></MidiDeviceChooser>

      </Toolbar>
    </AppBar>
  );
};

export default Header;
