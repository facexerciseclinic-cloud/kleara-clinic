import React from 'react';
import { Box, CircularProgress, Typography, Container } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'กำลังโหลดข้อมูล...', 
  fullPage = false 
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: fullPage ? 0 : 8,
      }}
    >
      <CircularProgress size={48} thickness={4} />
      <Typography variant="body1" color="text.secondary" fontWeight={500}>
        {message}
      </Typography>
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">{content}</Container>
      </Box>
    );
  }

  return content;
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'ไม่พบข้อมูล',
  message,
  icon,
  action,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 8,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box sx={{ fontSize: 64, opacity: 0.3, mb: 1 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" fontWeight={600} color="text.primary">
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" maxWidth={400}>
          {message}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
};
