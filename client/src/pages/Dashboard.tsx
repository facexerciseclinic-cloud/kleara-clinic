import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  IconButton,
  Chip,
  Paper,
  alpha,
  Skeleton,
  Divider,
} from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/States';
import {
  People,
  Today,
  Schedule,
  AttachMoney,
  TrendingUp,
  CalendarToday,
  Add,
  ArrowForward,
  Inventory2,
  Assessment,
  Payment,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingAppointments: number;
  todayRevenue: number;
  monthlyRevenue: number;
  inventoryLowStock: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'payment' | 'patient' | 'inventory' | 'treatment';
  message: string;
  time: string;
  status: 'success' | 'warning' | 'info';
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    inventoryLowStock: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/dashboard');
      const data = response.data.data;

      // Transform backend data
      setStats({
        totalPatients: data.quickStats?.totalPatients || 0,
        todayAppointments: data.today?.appointments || 0,
        pendingAppointments: data.today?.pendingAppointments || 0,
        todayRevenue: data.today?.revenue || 0,
        monthlyRevenue: data.month?.revenue || 0,
        inventoryLowStock: data.quickStats?.lowStockProducts || 0,
      });

      // Transform activities
      const recentActivities: RecentActivity[] = [];
      
      if (data.recentActivities) {
        // Add appointment activities
        data.recentActivities[0]?.forEach((apt: any) => {
          recentActivities.push({
            id: apt._id,
            type: 'appointment',
            message: `นัดหมายใหม่จาก ${apt.patient?.profile?.firstName || 'ผู้ป่วย'} เวลา ${apt.timeSlot?.start || ''}`,
            time: getRelativeTime(apt.createdAt),
            status: 'info',
          });
        });

        // Add treatment activities
        data.recentActivities[1]?.forEach((treatment: any) => {
          recentActivities.push({
            id: treatment._id,
            type: 'treatment',
            message: `รักษาโดย ${treatment.performedBy?.doctor?.profile?.firstName || 'แพทย์'} - ${treatment.treatmentType || 'Treatment'}`,
            time: getRelativeTime(treatment.createdAt),
            status: 'success',
          });
        });
      }

      setActivities(recentActivities.slice(0, 5));

      // Show notifications
      if (stats.inventoryLowStock > 0) {
        showNotification(`มีสินค้า ${stats.inventoryLowStock} รายการที่ใกล้หมด`, 'warning', false);
      }
      if (stats.pendingAppointments > 0) {
        showNotification(`มีนัดหมายที่รอการยืนยัน ${stats.pendingAppointments} รายการ`, 'info', false);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูล Dashboard ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'เมื่อสักครู่';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffInMinutes / 1440)} วันที่แล้ว`;
  };

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'ลงทะเบียนผู้ป่วยใหม่',
      description: 'เพิ่มข้อมูลผู้ป่วยใหม่',
      icon: <Add />,
      color: theme.palette.primary.main,
      route: '/patients',
    },
    {
      id: '2',
      title: 'นัดหมายใหม่',
      description: 'สร้างการนัดหมาย',
      icon: <CalendarToday />,
      color: theme.palette.success.main,
      route: '/appointments',
    },
    {
      id: '3',
      title: 'ระบบขายหน้าร้าน',
      description: 'ขายสินค้าและบริการ',
      icon: <Payment />,
      color: theme.palette.warning.main,
      route: '/pos',
    },
    {
      id: '4',
      title: 'รายงานยอดขาย',
      description: 'ดูสถิติและรายงาน',
      icon: <Assessment />,
      color: theme.palette.info.main,
      route: '/reports',
    },
  ];

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    prefix = '', 
    suffix = '',
    onClick,
    trend,
    isLoading = false
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    prefix?: string;
    suffix?: string;
    onClick?: () => void;
    trend?: number;
    isLoading?: boolean;
  }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.02)} 100%)`,
        border: `1px solid ${alpha(color, 0.12)}`,
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.5)})`,
        },
        '&:hover': {
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: onClick ? `0 12px 24px ${alpha(color, 0.2)}` : 'none',
          borderColor: alpha(color, 0.3),
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(color, 0.15),
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
              }}
            >
              {title}
            </Typography>
            {trend !== undefined && (
              <Chip
                label={`${trend >= 0 ? '+' : ''}${trend}%`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: trend >= 0 ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                  color: trend >= 0 ? '#4caf50' : '#f44336',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )}
          </Box>
          {onClick && (
            <IconButton size="small" sx={{ color: alpha(color, 0.7), mt: -0.5 }}>
              <ArrowForward fontSize="small" />
            </IconButton>
          )}
        </Stack>
        
        {isLoading ? (
          <Skeleton variant="text" width="60%" height={48} />
        ) : (
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: color,
              letterSpacing: '-0.5px',
            }}
          >
            {prefix}{value.toLocaleString('th-TH')}{suffix}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type: RecentActivity['type']) => {
    const iconMap = {
      appointment: <Schedule />,
      payment: <AttachMoney />,
      patient: <People />,
      inventory: <Inventory2 />,
      treatment: <Today />,
    };
    return iconMap[type];
  };

  const getStatusColor = (status: RecentActivity['status']) => {
    const colorMap = {
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      info: theme.palette.info.main,
    };
    return colorMap[status];
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูล Dashboard..." fullPage />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <PageHeader
          title="Dashboard"
          subtitle={`ภาพรวมระบบคลินิกความงาม - ${new Date().toLocaleDateString('th-TH', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`}
        />

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4 
        }}>
          <Box>
            <StatCard
              title="ผู้ป่วยทั้งหมด"
              value={stats.totalPatients}
              icon={<People />}
              color={theme.palette.primary.main}
              suffix=" คน"
              trend={12}
              onClick={() => navigate('/patients')}
              isLoading={loading}
            />
          </Box>
          
          <Box>
            <StatCard
              title="นัดหมายวันนี้"
              value={stats.todayAppointments}
              icon={<Today />}
              color={theme.palette.success.main}
              suffix=" ราย"
              trend={8}
              onClick={() => navigate('/appointments')}
              isLoading={loading}
            />
          </Box>
          
          <Box>
            <StatCard
              title="รอยืนยัน"
              value={stats.pendingAppointments}
              icon={<Schedule />}
              color={theme.palette.warning.main}
              suffix=" ราย"
              onClick={() => navigate('/appointments')}
              isLoading={loading}
            />
          </Box>
          
          <Box>
            <StatCard
              title="รายได้วันนี้"
              value={stats.todayRevenue}
              icon={<AttachMoney />}
              color={theme.palette.info.main}
              prefix="฿"
              trend={15}
              onClick={() => navigate('/reports')}
              isLoading={loading}
            />
          </Box>
        </Box>

        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              เมนูด่วน
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
              mt: 1
            }}>
              {quickActions.map((action) => (
                <Box key={action.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: `1px solid ${alpha(action.color, 0.2)}`,
                      background: `linear-gradient(135deg, ${alpha(action.color, 0.05)} 0%, transparent 100%)`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: action.color,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 16px ${alpha(action.color, 0.2)}`,
                      },
                    }}
                    onClick={() => navigate(action.route)}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: alpha(action.color, 0.1),
                        color: action.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {action.description}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3
        }}>
          <Box>
            <Card sx={{ borderRadius: 3, height: 400 }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    รายได้รายเดือน
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/reports')}
                  >
                    ดูรายละเอียด
                  </Button>
                </Stack>
                <Box
                  sx={{
                    height: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                    borderRadius: 2,
                    border: `2px dashed ${theme.palette.grey[300]}`,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 56, color: theme.palette.primary.main, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary" fontWeight={600}>
                    กราฟรายได้รายเดือน
                  </Typography>
                  <Chip
                    label={`รายได้เดือนนี้ ฿${stats.monthlyRevenue.toLocaleString('th-TH')}`}
                    sx={{ mt: 2, fontWeight: 600 }}
                    color="primary"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card sx={{ borderRadius: 3, height: 400 }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  กิจกรรมล่าสุด
                </Typography>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <Stack spacing={2}>
                    {activities.length > 0 ? (
                      activities.map((activity, index) => (
                        <Box key={activity.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 2,
                            }}
                          >
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              backgroundColor: alpha(getStatusColor(activity.status), 0.1),
                              color: getStatusColor(activity.status),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getActivityIcon(activity.type)}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                mb: 0.5,
                                color: 'text.primary',
                              }}
                            >
                              {activity.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                              }}
                            >
                              {activity.time}
                            </Typography>
                          </Box>
                        </Box>
                        {index < activities.length - 1 && (
                          <Divider sx={{ mt: 2 }} />
                        )}
                      </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                        ยังไม่มีกิจกรรมล่าสุด
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/notifications')}
                >
                  ดูทั้งหมด
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;