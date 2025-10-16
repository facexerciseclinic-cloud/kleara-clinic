import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'กำลังโหลด...' }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
      }}
    >
      <CircularProgress
        size={60}
        sx={{
          color: 'white',
          mb: 3,
        }}
      />
      <Typography
        variant="h5"
        sx={{
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        {message}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          opacity: 0.8,
          textAlign: 'center',
        }}
      >
        กรุณารอสักครู่...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;