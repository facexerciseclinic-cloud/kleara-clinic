import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ListIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { PageHeader } from '../components/common/PageHeader';

interface Appointment {
  _id: string;
  appointmentNumber: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
  };
  appointmentDate: string;
  timeSlot: {
    start: string;
    end: string;
  };
  services: Array<{
    serviceName: string;
    price: number;
  }>;
  status: string;
  assignedStaff?: {
    doctor?: {
      firstName: string;
      lastName: string;
    };
  };
  notes?: string;
}

const Appointments: React.FC = () => {
  const { showNotification } = useNotifications();
  const [view, setView] = useState<'day' | 'week' | 'month' | 'list'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '09:00-10:00',
    services: [],
    doctorId: '',
    notes: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    confirmed: 0,
    completed: 0
  });

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, view]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params: any = { view };
      if (view === 'day') {
        params.date = selectedDate;
      }

      const response = await api.get('/appointments', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAppointments(response.data.data.appointments || []);
        
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = response.data.data.appointments.filter(
          (apt: Appointment) => apt.appointmentDate.split('T')[0] === today
        );
        
        setStats({
          today: todayAppointments.length,
          pending: response.data.data.appointments.filter((apt: Appointment) => apt.status === 'pending').length,
          confirmed: response.data.data.appointments.filter((apt: Appointment) => apt.status === 'confirmed').length,
          completed: response.data.data.appointments.filter((apt: Appointment) => apt.status === 'completed').length
        });
      }
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      const [start, end] = formData.timeSlot.split('-');
      
      const response = await api.post('/appointments', {
        patient: formData.patientId,
        appointmentDate: formData.date,
        timeSlot: { start, end },
        services: formData.services,
        assignedStaff: formData.doctorId ? { doctor: formData.doctorId } : {},
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showNotification('Appointment created successfully', 'success');
        setOpenCreateDialog(false);
        fetchAppointments();
        resetForm();
      }
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to create appointment', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.patch(`/appointments/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showNotification(`Appointment ${newStatus}`, 'success');
        fetchAppointments();
      }
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleSendReminder = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/appointments/${id}/send-reminder`,
        { channels: ['sms', 'line'] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showNotification('Reminder sent successfully', 'success');
      }
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to send reminder', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '09:00-10:00',
      services: [],
      doctorId: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: any } = {
      'pending': 'warning',
      'confirmed': 'info',
      'checked-in': 'primary',
      'in-progress': 'secondary',
      'completed': 'success',
      'cancelled': 'error',
      'no-show': 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'pending': 'รอยืนยัน',
      'confirmed': 'ยืนยันแล้ว',
      'checked-in': 'เช็คอินแล้ว',
      'in-progress': 'กำลังรักษา',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก',
      'no-show': 'ไม่มา'
    };
    return labels[status] || status;
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="นัดหมาย"
        subtitle="จัดการนัดหมายและตารางเวลา"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            สร้างนัดหมาย
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">{stats.today}</Typography>
                <Typography variant="body2" color="text.secondary">นัดหมายวันนี้</Typography>
              </Box>
              <EventIcon fontSize="large" color="primary" />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">{stats.pending}</Typography>
                <Typography variant="body2" color="text.secondary">รอยืนยัน</Typography>
              </Box>
              <ScheduleIcon fontSize="large" color="warning" />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">{stats.confirmed}</Typography>
                <Typography variant="body2" color="text.secondary">ยืนยันแล้ว</Typography>
              </Box>
              <CheckCircleIcon fontSize="large" color="info" />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">{stats.completed}</Typography>
                <Typography variant="body2" color="text.secondary">เสร็จสิ้น</Typography>
              </Box>
              <CheckCircleIcon fontSize="large" color="success" />
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* View Toggle and Date Picker */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Tabs value={view} onChange={(e, v) => setView(v)}>
              <Tab icon={<EventIcon />} label="วัน" value="day" />
              <Tab icon={<CalendarIcon />} label="สัปดาห์" value="week" />
              <Tab icon={<CalendarIcon />} label="เดือน" value="month" />
              <Tab icon={<ListIcon />} label="รายการ" value="list" />
            </Tabs>
          </Box>
          <Box sx={{ flex: 1 }}>
            <TextField
              type="date"
              label="เลือกวันที่"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Appointments List */}
      <Stack spacing={2}>
        {loading ? (
          <Alert severity="info">กำลังโหลดข้อมูล...</Alert>
        ) : appointments.length === 0 ? (
          <Alert severity="info">ไม่มีนัดหมายในวันที่เลือก</Alert>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={2}>
            {appointments.map((appointment) => (
              <Card key={appointment._id} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 16px)', lg: '1 1 calc(33.333% - 16px)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {appointment.timeSlot.start}
                    </Typography>
                    <Chip
                      label={getStatusLabel(appointment.status)}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                    <Typography variant="body2">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                    <Typography variant="body2">{appointment.patient.phoneNumber}</Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    บริการ: {appointment.services.map(s => s.serviceName).join(', ')}
                  </Typography>

                  {appointment.assignedStaff?.doctor && (
                    <Typography variant="body2" color="text.secondary">
                      แพทย์: {appointment.assignedStaff.doctor.firstName} {appointment.assignedStaff.doctor.lastName}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions>
                  {appointment.status === 'pending' && (
                    <Button
                      size="small"
                      color="success"
                      onClick={() => handleUpdateStatus(appointment._id, 'confirmed')}
                    >
                      ยืนยัน
                    </Button>
                  )}
                  {appointment.status === 'confirmed' && (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleUpdateStatus(appointment._id, 'checked-in')}
                    >
                      เช็คอิน
                    </Button>
                  )}
                  <Button
                    size="small"
                    startIcon={<NotificationsIcon />}
                    onClick={() => handleSendReminder(appointment._id)}
                  >
                    แจ้งเตือน
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleUpdateStatus(appointment._id, 'cancelled')}
                  >
                    ยกเลิก
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Create Appointment Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>สร้างนัดหมายใหม่</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="รหัสผู้ป่วย"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              fullWidth
              required
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                type="date"
                label="วันที่นัดหมาย"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <FormControl fullWidth>
                <InputLabel>เวลา</InputLabel>
                <Select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  label="เวลา"
                >
                  {Array.from({ length: 11 }, (_, i) => i + 9).map(hour => (
                    <MenuItem key={hour} value={`${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`}>
                      {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="บันทึก"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleCreateAppointment}>สร้างนัดหมาย</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appointments;
