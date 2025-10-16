// React Core
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Material-UI Components
import {
  Snackbar,
  Alert,
  AlertTitle,
  Badge,
  IconButton,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
} from '@mui/material';

// Material-UI Icons
import {
  Notifications as NotificationsIcon,
  Schedule,
  AttachMoney,
  People,
  Warning,
  Info,
  Close,
} from '@mui/icons-material';

// Material-UI Theme
import { useTheme } from '@mui/material/styles';

// Router
import { useNavigate } from 'react-router-dom';

// TypeScript Interfaces
interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'patient' | 'inventory' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info', autoHide?: boolean) => void;
}

interface NotificationProviderProps {
  children: ReactNode;
}

interface NotificationBellProps {
  anchorEl?: HTMLElement | null;
  onToggle: (event: React.MouseEvent<HTMLElement>) => void;
  open: boolean;
  onClose: () => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  autoHide: boolean;
}

// Context Creation
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Custom Hook
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'appointment',
      title: 'นัดหมายใหม่',
      message: 'คุณสมใจ ใจดี นัดหมายวันนี้เวลา 14:00 น.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      priority: 'high',
      actionUrl: '/appointments',
    },
    {
      id: '2',
      type: 'payment',
      title: 'การชำระเงินสำเร็จ',
      message: 'ได้รับการชำระเงิน ฿2,500 จาก คุณวิไล สวยงาม',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      priority: 'medium',
      actionUrl: '/reports',
    },
    {
      id: '3',
      type: 'inventory',
      title: 'สินค้าใกล้หมด',
      message: 'เซรั่มหน้าใส เหลือ 5 ชิ้น ควรสั่งเพิ่ม',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: false,
      priority: 'high',
      actionUrl: '/inventory',
    },
  ]);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
    autoHide: true,
  });

  const unreadCount: number = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string): void => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = (): void => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string): void => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const showNotification = (
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info', 
    autoHide: boolean = true
  ): void => {
    setSnackbar({
      open: true,
      message,
      severity: type,
      autoHide,
    });
  };

  const handleCloseSnackbar = (): void => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Random chance to add a new notification
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const types: Array<Notification['type']> = ['appointment', 'payment', 'patient', 'inventory'];
        const priorities: Array<Notification['priority']> = ['low', 'medium', 'high'];
        const messages: Array<{
          type: Notification['type'];
          title: string;
          message: string;
        }> = [
          { type: 'appointment', title: 'นัดหมายใหม่', message: 'มีการนัดหมายใหม่เข้ามา' },
          { type: 'payment', title: 'การชำระเงิน', message: 'ได้รับการชำระเงินใหม่' },
          { type: 'patient', title: 'ผู้ป่วยใหม่', message: 'มีผู้ป่วยใหม่ลงทะเบียน' },
          { type: 'inventory', title: 'สต็อกสินค้า', message: 'สินค้าบางรายการใกล้หมด' },
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        addNotification({
          type: randomMessage.type,
          title: randomMessage.title,
          message: randomMessage.message,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Snackbar for immediate notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHide ? 6000 : null}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

// Notification Bell Component for Layout
export const NotificationBell: React.FC<NotificationBellProps> = ({
  anchorEl,
  onToggle,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const getNotificationIcon = (type: Notification['type']): React.ReactElement => {
    switch (type) {
      case 'appointment': return <Schedule sx={{ fontSize: 16 }} />;
      case 'payment': return <AttachMoney sx={{ fontSize: 16 }} />;
      case 'patient': return <People sx={{ fontSize: 16 }} />;
      case 'inventory': return <Warning sx={{ fontSize: 16 }} />;
      case 'system': return <Info sx={{ fontSize: 16 }} />;
      default: return <NotificationsIcon sx={{ fontSize: 16 }} />;
    }
  };

  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return `${days} วันที่แล้ว`;
  };

  const handleNotificationClick = (notification: Notification): void => {
    markAsRead(notification.id);
    onClose();
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <>
      <IconButton
        onClick={onToggle}
        sx={{
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        sx={{ zIndex: 1300 }}
      >
        <Paper
          sx={{
            mt: 1,
            width: 360,
            maxHeight: 400,
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }}
        >
          <Box sx={{ p: 2, backgroundColor: theme.palette.primary.main, color: 'white' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              การแจ้งเตือน
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {unreadCount > 0 ? `${unreadCount} รายการใหม่` : 'ไม่มีรายการใหม่'}
            </Typography>
          </Box>

          <List sx={{ p: 0, maxHeight: 280, overflow: 'auto' }}>
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    component="div"
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      py: 1.5,
                      cursor: 'pointer',
                      backgroundColor: notification.read ? 'transparent' : `${theme.palette.primary.main}08`,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              fontSize: '0.875rem',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.primary.main,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              mb: 0.5,
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontSize: '0.7rem', color: 'text.secondary' }}
                          >
                            {formatTime(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" align="center">
                      ไม่มีการแจ้งเตือน
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>

          {notifications.length > 5 && (
            <>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Button
                  fullWidth
                  size="small"
                  onClick={() => {
                    onClose();
                    navigate('/notifications');
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  ดูทั้งหมด ({notifications.length})
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Popper>
    </>
  );
};

export default NotificationProvider;