import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Container,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Search,
  LocalHospital,
  Visibility,
  Edit,
  History,
  Person,
  CalendarToday,
} from '@mui/icons-material';
import { api } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { LoadingState, EmptyState } from '../components/common/States';

interface Treatment {
  id: string;
  patientName: string;
  patientHN: string;
  service: string;
  date: string;
  time: string;
  doctor: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  cost: number;
  notes?: string;
}

const Treatments: React.FC = () => {
  const { showNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState(0);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // States for new treatment form
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [treatmentDate, setTreatmentDate] = useState('');
  const [treatmentTime, setTreatmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch treatments from API
  useEffect(() => {
    fetchTreatments();
    fetchPatients();
    fetchServices();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      if (response.data.success) {
        const patientsData = response.data.data?.patients || response.data.data || [];
        setPatients(patientsData);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      if (response.data.success) {
        const servicesData = response.data.data || [];
        // Filter only treatment services
        const treatmentServices = servicesData.filter((s: any) => s.category === 'treatment' || s.type === 'service');
        setServices(treatmentServices);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/treatments');
      console.log('Treatments API response:', response.data);
      
      if (response.data.success) {
        // Handle different response structures
        const treatmentsData = response.data.data?.treatments || response.data.data || response.data.treatments || [];
        
        if (!Array.isArray(treatmentsData)) {
          console.warn('Treatments data is not an array:', treatmentsData);
          setTreatments([]);
          showNotification('ไม่พบข้อมูลการรักษา', 'warning');
          return;
        }
        
        const transformedTreatments = treatmentsData.map((t: any) => ({
          id: t._id,
          patientName: `${t.patient?.profile?.firstName || t.patient?.firstName || ''} ${t.patient?.profile?.lastName || t.patient?.lastName || ''}`.trim() || 'ไม่ระบุ',
          patientHN: t.patient?.hn || t.patientHN || '-',
          service: t.treatmentType || t.service || t.name || '-',
          date: t.treatmentDate || t.date ? new Date(t.treatmentDate || t.date).toISOString().split('T')[0] : '-',
          time: t.treatmentDate || t.date ? new Date(t.treatmentDate || t.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-',
          doctor: `${t.performedBy?.doctor?.profile?.firstName || t.doctor?.firstName || ''} ${t.performedBy?.doctor?.profile?.lastName || t.doctor?.lastName || ''}`.trim() || 'ไม่ระบุ',
          status: t.status || 'scheduled',
          cost: t.charges?.total || t.cost || t.price || 0,
          notes: t.notes || '',
        }));
        
        setTreatments(transformedTreatments);
        console.log('Transformed treatments:', transformedTreatments.length);
      } else {
        setTreatments([]);
        showNotification('ไม่สามารถโหลดข้อมูลได้', 'warning');
      }
    } catch (err: any) {
      console.error('Failed to fetch treatments:', err);
      showNotification('ไม่สามารถโหลดข้อมูลการรักษาได้', 'error');
      setTreatments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTreatment = async () => {
    if (!selectedPatient || !selectedService || !treatmentDate || !treatmentTime) {
      showNotification('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    try {
      setSaving(true);
      const treatmentData = {
        patient: selectedPatient._id,
        treatmentType: selectedService.name, // Keep original name for backend to map
        treatmentTypeName: selectedService.name, // Store full name
        service: selectedService._id,
        treatmentDate: new Date(`${treatmentDate}T${treatmentTime}`).toISOString(),
        status: 'in-progress', // Use valid enum value
        notes: notes,
        charges: {
          total: selectedService.price || 0
        },
        billing: {
          totalCost: selectedService.price || 0,
          procedureFee: selectedService.price || 0,
          finalAmount: selectedService.price || 0,
          paymentStatus: 'pending'
        },
        procedures: [{
          procedureName: selectedService.name,
          cost: selectedService.price || 0
        }]
      };

      console.log('Sending treatment data:', treatmentData);
      const response = await api.post('/treatments', treatmentData);
      
      if (response.data.success) {
        showNotification('บันทึกการรักษาสำเร็จ', 'success');
        // Reset form
        setSelectedPatient(null);
        setSelectedService(null);
        setTreatmentDate('');
        setTreatmentTime('');
        setNotes('');
        // Refresh list
        fetchTreatments();
        // Switch to list tab
        setActiveTab(0);
      }
    } catch (error: any) {
      console.error('Failed to save treatment:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'scheduled': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'เสร็จสิ้น';
      case 'in-progress': return 'กำลังดำเนินการ';
      case 'scheduled': return 'นัดหมายแล้ว';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const filteredTreatments = treatments.filter(treatment =>
    treatment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    treatment.patientHN.toLowerCase().includes(searchTerm.toLowerCase()) ||
    treatment.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลการรักษา..." />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <LocalHospital sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        การรักษา
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            label="รายการการรักษา" 
            icon={<LocalHospital />} 
            iconPosition="start"
          />
          <Tab 
            label="เพิ่มการรักษาใหม่" 
            icon={<Add />} 
            iconPosition="start"
          />
          <Tab 
            label="ประวัติการรักษา" 
            icon={<History />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="ค้นหาการรักษา (ชื่อผู้ป่วย, HN, หรือบริการ)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={{ minWidth: 150 }}
                  onClick={() => setActiveTab(1)}
                >
                  เพิ่มการรักษา
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {filteredTreatments.length === 0 ? (
            <EmptyState
              title="ไม่พบข้อมูลการรักษา"
              message="ยังไม่มีข้อมูลการรักษาในระบบ หรือลองค้นหาด้วยคำค้นอื่น"
            />
          ) : (
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ผู้ป่วย</TableCell>
                      <TableCell>บริการ</TableCell>
                      <TableCell>วันที่</TableCell>
                      <TableCell>เวลา</TableCell>
                      <TableCell>แพทย์</TableCell>
                      <TableCell>สถานะ</TableCell>
                      <TableCell>ค่าใช้จ่าย</TableCell>
                      <TableCell>จัดการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTreatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {treatment.patientName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {treatment.patientHN}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{treatment.service}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                          {new Date(treatment.date).toLocaleDateString('th-TH')}
                        </Box>
                      </TableCell>
                      <TableCell>{treatment.time}</TableCell>
                      <TableCell>{treatment.doctor}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(treatment.status)}
                          color={getStatusColor(treatment.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          ฿{treatment.cost.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Edit />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>เพิ่มการรักษาใหม่</Typography>
            <Stack spacing={3}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.profile?.firstName || ''} ${option.profile?.lastName || ''} (HN: ${option.hn || 'N/A'})`.trim()}
                value={selectedPatient}
                onChange={(_event, newValue) => setSelectedPatient(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="เลือกผู้ป่วย" placeholder="ค้นหาด้วยชื่อหรือ HN" />
                )}
                loading={patients.length === 0}
              />
              
              <Autocomplete
                options={services}
                getOptionLabel={(option) => `${option.name} - ${option.price?.toLocaleString() || 0} บาท`}
                value={selectedService}
                onChange={(_event, newValue) => setSelectedService(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="เลือกบริการ" placeholder="ค้นหาบริการ" />
                )}
                loading={services.length === 0}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="วันที่"
                  type="date"
                  value={treatmentDate}
                  onChange={(e) => setTreatmentDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="เวลา"
                  type="time"
                  value={treatmentTime}
                  onChange={(e) => setTreatmentTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              
              <TextField
                fullWidth
                label="หมายเหตุ"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="บันทึกเพิ่มเติม"
              />
              
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button 
                  variant="outlined"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSelectedService(null);
                    setTreatmentDate('');
                    setTreatmentTime('');
                    setNotes('');
                  }}
                  disabled={saving}
                >
                  ยกเลิก
                </Button>
                <Button 
                  variant="contained"
                  onClick={handleSaveTreatment}
                  disabled={saving || !selectedPatient || !selectedService}
                >
                  {saving ? <CircularProgress size={24} /> : 'บันทึก'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>ประวัติการรักษา</Typography>
            <Typography color="text.secondary">
              แสดงประวัติการรักษาทั้งหมดของคลินิก
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Treatments;