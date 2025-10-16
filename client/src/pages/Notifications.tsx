import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Button,
  Stack,
} from '@mui/material';
import {
  Notifications,
  Schedule,
  AttachMoney,
  People,
  Warning,
  CheckCircle,
  Info,
  Delete,
  MarkAsUnread,
  Settings,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'patient' | 'inventory' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

const NotificationsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'appointment',
      title: 'นัดหมายใหม่',
      message: 'คุณสมใจ ใจดี นัดหมายวันนี้เวลา 14:00 น.',
      time: '5 นาทีที่แล้ว',
      read: false,
      priority: 'high',
      actionUrl: '/appointments',
    },
    {
      id: '2',
      type: 'payment',
      title: 'การชำระเงินสำเร็จ',
      message: 'ได้รับการชำระเงิน ฿2,500 จาก คุณวิไล สวยงาม',
      time: '15 นาทีที่แล้ว',
      read: false,
      priority: 'medium',
      actionUrl: '/reports',
    },
    {
      id: '3',
      type: 'inventory',
      title: 'สินค้าใกล้หมด',
      message: 'เซรั่มหน้าใส เหลือ 5 ชิ้น ควรสั่งเพิ่ม',
      time: '1 ชั่วโมงที่แล้ว',
      read: false,
      priority: 'high',
      actionUrl: '/inventory',
    },
    {
      id: '4',
      type: 'patient',
      title: 'ผู้ป่วยใหม่',
      message: 'คุณมาลี รักสุข ลงทะเบียนเข้าระบบ',
      time: '2 ชั่วโมงที่แล้ว',
      read: true,
      priority: 'low',
      actionUrl: '/patients',
    },
    {
      id: '5',
      type: 'system',
      title: 'อัปเดตระบบ',
      message: 'ระบบได้รับการอัปเดตเวอร์ชันใหม่เรียบร้อยแล้ว',
      time: '1 วันที่แล้ว',
      read: true,
      priority: 'low',
    },
  ]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment': return <Schedule />;
      case 'payment': return <AttachMoney />;
      case 'patient': return <People />;
      case 'inventory': return <Warning />;
      case 'system': return <Info />;
      default: return <Notifications />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.background.default} 100%)`,
        py: 3,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            การแจ้งเตือน
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary">
              คุณมีการแจ้งเตือนใหม่ {unreadCount} รายการ
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                อ่านทั้งหมด
              </Button>
              <IconButton color="primary">
                <Settings />
              </IconButton>
            </Stack>
          </Box>
        </Box>

        {/* Notifications List */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      cursor: notification.actionUrl ? 'pointer' : 'default',
                      backgroundColor: notification.read ? 'transparent' : `${theme.palette.primary.main}05`,
                      '&:hover': {
                        backgroundColor: notification.actionUrl ? `${theme.palette.action.hover}` : 'transparent',
                      },
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: `${getPriorityColor(notification.priority)}15`,
                          color: getPriorityColor(notification.priority),
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Box>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              color: notification.read ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.primary.main,
                              }}
                            />
                          )}
                          <Chip
                            size="small"
                            label={notification.priority === 'high' ? 'สำคัญ' : notification.priority === 'medium' ? 'ปกติ' : 'ทั่วไป'}
                            color={notification.priority === 'high' ? 'error' : notification.priority === 'medium' ? 'warning' : 'success'}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: notification.read ? 'text.secondary' : 'text.primary',
                              mb: 0.5,
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notification.time}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {!notification.read && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <CheckCircle />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {notifications.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Notifications sx={{ fontSize: 64, color: theme.palette.grey[300], mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  ไม่มีการแจ้งเตือน
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  คุณได้อ่านการแจ้งเตือนทั้งหมดแล้ว
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default NotificationsPage;