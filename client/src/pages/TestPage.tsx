import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const TestPage: React.FC = () => {
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
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
        🎉 Kleara Clinic
      </Typography>
      <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
        ระบบจัดการคลินิกความงาม
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, opacity: 0.8 }}>
        การโหลดสำเร็จแล้ว! ระบบพร้อมใช้งาน
      </Typography>
      <Button
        variant="contained"
        size="large"
        sx={{
          bgcolor: 'white',
          color: theme.palette.primary.main,
          fontWeight: 600,
          px: 4,
          py: 1.5,
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.9)',
          },
        }}
        onClick={() => {
          window.location.href = '/dashboard';
        }}
      >
        เข้าสู่ Dashboard
      </Button>
    </Box>
  );
};

export default TestPage;