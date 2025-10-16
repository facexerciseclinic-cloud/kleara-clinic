import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const modernTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // สีฟ้าสดใส
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#03dac6', // สีเทอควอยซ์สดใส
      light: '#4fd8d0',
      dark: '#00a896',
      contrastText: '#000000',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    background: {
      default: '#f8fafc', // สีขาวอมฟ้าอ่อน
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#718096',
    },
    divider: alpha('#1976d2', 0.12),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12, // มุมโค้งที่ทันสมัย
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(25, 118, 210, 0.12), 0px 1px 2px rgba(25, 118, 210, 0.24)',
    '0px 3px 6px rgba(25, 118, 210, 0.16), 0px 3px 6px rgba(25, 118, 210, 0.23)',
    '0px 10px 20px rgba(25, 118, 210, 0.19), 0px 6px 6px rgba(25, 118, 210, 0.23)',
    '0px 14px 28px rgba(25, 118, 210, 0.25), 0px 10px 10px rgba(25, 118, 210, 0.22)',
    '0px 19px 38px rgba(25, 118, 210, 0.30), 0px 15px 12px rgba(25, 118, 210, 0.22)',
    '0px 24px 48px rgba(25, 118, 210, 0.35), 0px 19px 19px rgba(25, 118, 210, 0.22)',
    '0px 32px 64px rgba(25, 118, 210, 0.35), 0px 24px 24px rgba(25, 118, 210, 0.22)',
    '0px 40px 80px rgba(25, 118, 210, 0.35), 0px 30px 30px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
    '0px 48px 96px rgba(25, 118, 210, 0.35), 0px 36px 36px rgba(25, 118, 210, 0.22)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#1976d2 #f8fafc',
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: '#f8fafc',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#1976d2',
            borderRadius: 4,
            '&:hover': {
              backgroundColor: '#1565c0',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(25, 118, 210, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 12px 24px rgba(25, 118, 210, 0.15), 0px 8px 8px rgba(25, 118, 210, 0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          textTransform: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0px 4px 12px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            boxShadow: '0px 6px 16px rgba(25, 118, 210, 0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: alpha('#1976d2', 0.2),
            },
            '&:hover fieldset': {
              borderColor: alpha('#1976d2', 0.4),
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(25, 118, 210, 0.15)',
          borderBottom: '1px solid rgba(25, 118, 210, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(25, 118, 210, 0.08)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: alpha('#1976d2', 0.08),
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#1976d2', 0.12),
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: '#1976d2',
              borderRadius: '0 4px 4px 0',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: alpha('#1976d2', 0.12),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

export default modernTheme;