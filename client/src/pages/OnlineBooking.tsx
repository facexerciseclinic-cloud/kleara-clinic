import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OnlineBooking: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [appointmentNumber, setAppointmentNumber] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Patient Info
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    gender: 'female',
    
    // Step 2: Service Selection
    selectedService: '',
    
    // Step 3: Date & Time
    selectedDate: '',
    selectedTimeSlot: ''
  });

  const steps = ['ข้อมูลส่วนตัว', 'เลือกบริการ', 'เลือกวันและเวลา', 'ยืนยันการจอง'];

  const services = [
    { id: 'botox', name: 'Botox Injection', duration: 60, price: 8000 },
    { id: 'filler', name: 'Dermal Filler', duration: 90, price: 12000 },
    { id: 'laser', name: 'Laser Treatment', duration: 60, price: 5000 },
    { id: 'facial', name: 'Deep Cleansing Facial', duration: 90, price: 3500 },
    { id: 'thread', name: 'Thread Lift', duration: 120, price: 25000 }
  ];

  useEffect(() => {
    if (activeStep === 2 && formData.selectedDate && formData.selectedService) {
      fetchAvailableSlots();
    }
  }, [formData.selectedDate, formData.selectedService, activeStep]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const service = services.find(s => s.id === formData.selectedService);
      const response = await axios.get(`${API_BASE_URL}/appointments/availability/slots`, {
        params: {
          date: formData.selectedDate,
          duration: service?.duration || 60
        }
      });

      if (response.data.success) {
        setAvailableSlots(response.data.data.slots.filter((slot: any) => slot.available));
      }
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.phoneNumber &&
          formData.dateOfBirth
        );
      case 1:
        return !!formData.selectedService;
      case 2:
        return !!(formData.selectedDate && formData.selectedTimeSlot);
      default:
        return true;
    }
  };

  const handleBooking = async () => {
    try {
      setLoading(true);
      const service = services.find(s => s.id === formData.selectedService);
      
      const response = await axios.post(`${API_BASE_URL}/appointments/online-booking`, {
        patientInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender
        },
        appointmentDate: formData.selectedDate,
        timeSlot: formData.selectedTimeSlot,
        services: [{
          serviceName: service?.name || '',
          estimatedDuration: service?.duration || 60,
          price: service?.price || 0
        }],
        notes: 'จองผ่าน Online Booking'
      });

      if (response.data.success) {
        setAppointmentNumber(response.data.data.appointmentNumber);
        setBookingComplete(true);
        setActiveStep(4);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'การจองล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom>
              กรอกข้อมูลส่วนตัว
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="ชื่อ"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="นามสกุล"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                fullWidth
                required
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="เบอร์โทรศัพท์"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                fullWidth
                required
                placeholder="0812345678"
              />
              <TextField
                label="อีเมล"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="วันเกิด"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>เพศ</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  label="เพศ"
                >
                  <MenuItem value="female">หญิง</MenuItem>
                  <MenuItem value="male">ชาย</MenuItem>
                  <MenuItem value="other">อื่นๆ</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom>
              เลือกบริการที่ต้องการ
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={2}>
              {services.map((service) => (
                <Card
                  key={service.id}
                  sx={{
                    flex: { xs: '1 1 100%', md: '1 1 calc(50% - 16px)' },
                    cursor: 'pointer',
                    border: formData.selectedService === service.id ? 2 : 1,
                    borderColor: formData.selectedService === service.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setFormData({ ...formData, selectedService: service.id })}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {service.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip
                        icon={<ScheduleIcon />}
                        label={`${service.duration} นาที`}
                        size="small"
                      />
                      <Chip
                        label={`฿${service.price.toLocaleString()}`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        );

      case 2:
        const selectedService = services.find(s => s.id === formData.selectedService);
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                เลือกวันและเวลา
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                บริการที่เลือก: {selectedService?.name} ({selectedService?.duration} นาที)
              </Alert>
            </Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="เลือกวันที่"
                type="date"
                value={formData.selectedDate}
                onChange={(e) => setFormData({ ...formData, selectedDate: e.target.value, selectedTimeSlot: '' })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0]
                }}
              />
            </Stack>
            {formData.selectedDate && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  ช่วงเวลาว่าง
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : availableSlots.length === 0 ? (
                  <Alert severity="warning">ไม่มีช่วงเวลาว่างในวันที่เลือก</Alert>
                ) : (
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={formData.selectedTimeSlot === `${slot.startTime}-${slot.endTime}` ? 'contained' : 'outlined'}
                        sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(33.333% - 8px)', md: '1 1 calc(25% - 8px)' } }}
                        onClick={() => setFormData({ ...formData, selectedTimeSlot: `${slot.startTime}-${slot.endTime}` })}
                      >
                        {slot.startTime}
                      </Button>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
        );

      case 3:
        const confirmService = services.find(s => s.id === formData.selectedService);
        return (
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom>
              ยืนยันการจอง
            </Typography>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">ข้อมูลส่วนตัว</Typography>
                <Typography variant="body1">
                  {formData.firstName} {formData.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  โทร: {formData.phoneNumber}
                </Typography>
                {formData.email && (
                  <Typography variant="body2" color="text.secondary">
                    อีเมล: {formData.email}
                  </Typography>
                )}
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  บริการ
                </Typography>
                <Typography variant="body1">{confirmService?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ระยะเวลา: {confirmService?.duration} นาที
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ราคา: ฿{confirmService?.price.toLocaleString()}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  วันและเวลา
                </Typography>
                <Typography variant="body1">
                  {new Date(formData.selectedDate).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  เวลา: {formData.selectedTimeSlot.split('-')[0]} น.
                </Typography>
              </CardContent>
            </Card>
            <Alert severity="warning">
              กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยันการจอง
            </Alert>
          </Stack>
        );

      default:
        return null;
    }
  };

  if (bookingComplete) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            จองนัดหมายสำเร็จ!
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            หมายเลขนัดหมาย: {appointmentNumber}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            เราได้ส่งข้้อความยืนยันไปยังเบอร์โทรศัพท์ของคุณแล้ว
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            กรุณามาถึงก่อนเวลานัด 10 นาที
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => window.location.reload()}
          >
            จองนัดหมายใหม่
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <EventIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              จองนัดหมายออนไลน์
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kleara Clinic - Beauty & Aesthetic Center
            </Typography>
          </Box>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            ย้อนกลับ
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleBooking}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'ยืนยันการจอง'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!validateStep(activeStep)}
              >
                ถัดไป
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default OnlineBooking;
