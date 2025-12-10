import { Box, Typography } from '@mui/material';

export default function WIPBanner() {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '200px',
        height: '200px',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: '50px',
          left: '-50px',
          width: '250px',
          backgroundColor: 'primary.main', // Orange color
          color: 'white',
          textAlign: 'center',
          padding: '8px 0',
          transform: 'rotate(45deg)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'auto',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            letterSpacing: '1px',
            fontSize: '14px',
          }}
        >
          WORK IN PROGRESS
        </Typography>
      </Box>
    </Box>
  );
}