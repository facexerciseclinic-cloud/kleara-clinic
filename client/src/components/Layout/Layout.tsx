import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  alpha,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as TreatmentIcon,
  ShoppingCart as POSIcon,
  Inventory as InventoryIcon,
  Group as StaffIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationBell } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

// Types
interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItemData {
  text: string;
  icon: React.ReactElement;
  path: string;
  permission: string | null;
}

// Mock user data (for development)
const mockUser = {
  profile: {
    firstName: 'ผู้ดูแล',
    lastName: 'ระบบ',
    profileImage: '',
  },
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // State management
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Auth from context
  const { logout, hasPermission } = useAuth();

  // Event handlers
  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = (): void => {
    try {
      logout(); // clears token, user, and Authorization header
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Menu configuration
  const menuItems: MenuItemData[] = [
    {
      text: 'แดชบอร์ด',
      icon: <DashboardIcon />,
      path: '/dashboard',
      permission: null,
    },
    {
      text: 'ผู้ป่วย',
      icon: <PeopleIcon />,
      path: '/patients',
      permission: 'patients',
    },
    {
      text: 'การรักษา',
      icon: <TreatmentIcon />,
      path: '/treatments',
      permission: 'treatments',
    },
    {
      text: 'จุดขาย (POS)',
      icon: <POSIcon />,
      path: '/pos',
      permission: 'billing',
    },
    {
      text: 'คลังสินค้า',
      icon: <InventoryIcon />,
      path: '/inventory',
      permission: 'inventory',
    },
    {
      text: 'พนักงาน',
      icon: <StaffIcon />,
      path: '/staff',
      permission: 'staff',
    },
    {
      text: 'รายงาน',
      icon: <ReportsIcon />,
      path: '/reports',
      permission: 'reports',
    },
    {
      text: 'Sessions',
      icon: <ReportsIcon />,
      path: '/sessions',
      permission: 'staff',
    },
    {
      text: 'การแจ้งเตือน',
      icon: <NotificationsIcon />,
      path: '/notifications',
      permission: null,
    },
  ];

  const bottomMenuItems: MenuItemData[] = [
    {
      text: 'ตั้งค่า',
      icon: <SettingsIcon />,
      path: '/settings',
      permission: 'admin', // Only admins can see this
    },
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            🏥
          </Box>
          <Box>
            <Typography variant="h6" component="div" fontWeight="700" sx={{ fontSize: '1.1rem' }}>
              Kleara Clinic
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
              Management System
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box sx={{ p: 1, flexGrow: 1 }}>
        <List sx={{ py: 1 }}>
          {menuItems.map((item) => {
            if (item.permission && !hasPermission(item.permission, 'read')) {
              return null;
            }

            const isActive = location.pathname.startsWith(item.path);

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  selected={isActive}
                  sx={{
                    mx: 1,
                    borderRadius: 3,
                    minHeight: 48,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 0,
                      backgroundColor: 'primary.main',
                      transition: 'width 0.2s ease',
                      borderRadius: '0 8px 8px 0',
                    },
                    '&:hover': {
                      backgroundColor: alpha('#1976d2', 0.08),
                      transform: 'translateX(4px)',
                      '&::before': {
                        width: 4,
                      },
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha('#1976d2', 0.15),
                      color: 'primary.main',
                      fontWeight: 600,
                      '&::before': {
                        width: 4,
                      },
                      '&:hover': {
                        backgroundColor: alpha('#1976d2', 0.2),
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? 'primary.main' : 'text.secondary',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <Box sx={{ p: 1 }}>
        <Divider sx={{ my: 1 }} />
        <List>
          {bottomMenuItems.map((item) => {
            if (item.permission && !hasPermission(item.permission, 'read')) {
              return null;
            }
            const isActive = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  selected={isActive}
                  sx={{
                    mx: 1,
                    borderRadius: 3,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(25, 118, 210, 0.08)',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: 'primary.main',
              '&:hover': {
                backgroundColor: alpha('#1976d2', 0.08),
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              ระบบจัดการคลินิก Kleara
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton 
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: alpha('#1976d2', 0.08),
                  color: 'primary.main',
                },
              }}
            >
              <Badge 
                badgeContent={3} 
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ff5722',
                    color: 'white',
                    fontSize: '0.75rem',
                    minWidth: '18px',
                    height: '18px',
                  },
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Notification Bell */}
            <NotificationBell
              anchorEl={notificationAnchor}
              onToggle={(event) => setNotificationAnchor(notificationAnchor ? null : event.currentTarget)}
              open={Boolean(notificationAnchor)}
              onClose={() => setNotificationAnchor(null)}
            />

            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <Avatar
                sx={{ 
                  width: 40, 
                  height: 40,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  },
                }}
                src={mockUser.profile.profileImage}
              >
                {mockUser.profile.firstName?.charAt(0)}
              </Avatar>
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          โปรไฟล์
        </MenuItem>
        {hasPermission('admin', 'read') && (
          <MenuItem onClick={() => navigate('/settings')}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            ตั้งค่า
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          ออกจากระบบ
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;