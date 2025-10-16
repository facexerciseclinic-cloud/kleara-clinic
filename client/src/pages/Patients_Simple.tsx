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
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  IconButton,
  Fade,
  Slide,
  CircularProgress,
  Alert,
} from '@mui/material';
import { GridItem } from '../components/common/GridItem';
import {
  Person,
  Search,
  Add,
  Visibility,
  Edit,
  History,
  Phone,
  Email,
  CalendarToday,
  LocationOn,
  Close,
  FilterList,
  MoreVert,
  FaceRetouchingNatural,
  Star,
  VpnKey,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';
import { LoadingState, EmptyState } from '../components/common/States';

interface Patient {
  id: string;
  hn: string;
  name: string;
  nickname: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  occupation: string;
  membership: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  lastVisit: string;
  totalSpending: number;
  loyaltyPoints: number;
}

const samplePatients: Patient[] = [
  {
    id: '1',
    hn: 'HN001',
    name: 'สมศรี ใจดี',
    nickname: 'ศรี',
    age: 28,
    gender: 'หญิง',
    phone: '081-234-5678',
    email: 'somsri@email.com',
    address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    birthDate: '1995-03-15',
    occupation: 'พนักงานบริษัท',
    membership: 'Gold',
    lastVisit: '2024-01-10',
    totalSpending: 45000,
    loyaltyPoints: 450,
  },
  {
    id: '2',
    hn: 'HN002',
    name: 'วิไล สวยงาม',
    nickname: 'ไล',
    age: 35,
    gender: 'หญิง',
    phone: '082-345-6789',
    email: 'wilai@email.com',
    address: '456 ถนนราชดำริ กรุงเทพฯ 10330',
    birthDate: '1988-07-22',
    occupation: 'นักธุรกิจ',
    membership: 'Platinum',
    lastVisit: '2024-01-08',
    totalSpending: 120000,
    loyaltyPoints: 1200,
  },
  {
    id: '3',
    hn: 'HN003',
    name: 'มานะ ขยันดี',
    nickname: 'นะ',
    age: 42,
    gender: 'ชาย',
    phone: '083-456-7890',
    email: 'mana@email.com',
    address: '789 ถนนเพชรบุรี กรุงเทพฯ 10400',
    birthDate: '1981-11-08',
    occupation: 'แพทย์',
    membership: 'Diamond',
    lastVisit: '2024-01-12',
    totalSpending: 250000,
    loyaltyPoints: 2500,
  },
];

const Patients: React.FC = () => {
  const theme = useTheme();
  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'add' | 'edit' | 'points' | 'portal'>('view');
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  const [portalPassword, setPortalPassword] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralValidated, setReferralValidated] = useState<boolean>(false);
  const [referralMessage, setReferralMessage] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/patients');
      console.log('Patients API response:', response.data); // Debug log
      
      if (response.data.success) {
        // Backend returns: { success: true, data: { patients: [...], pagination: {...} } }
        const patientsData = response.data.data?.patients || response.data.data || [];
        
        if (Array.isArray(patientsData)) {
          const transformedPatients = patientsData.map((p: any) => ({
            id: p._id,
            hn: p.hn,
            name: `${p.profile.firstName} ${p.profile.lastName}`,
            nickname: p.profile.nickname,
            age: calculateAge(p.profile.dateOfBirth),
            gender: p.profile.gender === 'male' ? 'ชาย' : 'หญิง',
            phone: p.profile.contact?.phone || p.contact?.phone || '',
            email: p.profile.contact?.email || p.contact?.email || '',
            address: p.profile.address?.current?.street || p.contact?.address?.current?.street || '',
            birthDate: p.profile.dateOfBirth,
            occupation: p.profile.occupation || '',
            membership: p.membershipInfo?.level || 'Silver',
            lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'N/A',
            totalSpending: p.financials?.totalSpending || 0,
            loyaltyPoints: p.loyaltyPoints || 0,
          }));
          setPatients(transformedPatients);
          console.log('Transformed patients:', transformedPatients.length);
        } else {
          console.warn('Patients data is not an array:', patientsData);
          setPatients([]);
          showNotification('ไม่พบข้อมูลผู้ป่วย', 'warning');
        }
      } else {
        setError('Failed to fetch patients');
        showNotification('ไม่สามารถโหลดข้อมูลผู้ป่วยได้', 'error');
        setPatients([]);
      }
    } catch (err) {
      setError('An error occurred while fetching patients');
      showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ป่วย', 'error');
      console.error('Fetch patients error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const openDialog = (type: 'view' | 'add' | 'edit' | 'points' | 'portal', patient?: Patient) => {
    setDialogType(type);
    setSelectedPatient(patient || null);
    
    // Initialize form data
    if (type === 'edit' && patient) {
      setFormData({
        name: patient.name,
        nickname: patient.nickname,
        phone: patient.phone,
        email: patient.email,
        birthDate: patient.birthDate,
        gender: patient.gender,
        occupation: patient.occupation,
        address: patient.address,
        membership: patient.membership,
      });
    } else if (type === 'add') {
      setFormData({});
    } else if (type === 'points') {
      setPointsToAdd(0);
    } else if (type === 'portal') {
      setPortalPassword('');
    }
    
    setDialogOpen(true);
    
    // แจ้งเตือนเมื่อเปิด dialog
    if (type === 'view' && patient) {
      showNotification(`เปิดข้อมูลผู้ป่วย: ${patient.name}`, 'info');
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedPatient(null);
    setFormData({});
    setPointsToAdd(0);
    setPortalPassword('');
    setReferralCode('');
    setReferralValidated(false);
    setReferralMessage('');
  };

  const handleAddPatient = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.phone || !formData.birthDate) {
        showNotification('กรุณากรอกข้อมูลที่จำเป็น: ชื่อ-นามสกุล, เบอร์โทรศัพท์, และวันเกิด', 'error');
        return;
      }

      // Prepare data for backend
      const patientData: any = {
        profile: {
          firstName: formData.name?.split(' ')[0] || 'ผู้ป่วย',
          lastName: formData.name?.split(' ').slice(1).join(' ') || 'ใหม่',
          nickname: formData.nickname || '',
          dateOfBirth: formData.birthDate || new Date().toISOString(),
          gender: formData.gender === 'ชาย' ? 'male' : 'female',
          contact: {
            phone: formData.phone || '000-000-0000',
            email: formData.email || '',
          },
          address: {
            current: {
              street: formData.address || '',
            },
          },
        },
        pdpaConsent: {
          dataProcessing: true,
          marketing: false,
          thirdPartySharing: false,
        },
        membershipInfo: {
          level: formData.membership || 'Silver',
        },
      };

      // Only add occupation if it has a value
      if (formData.occupation && formData.occupation.trim() !== '') {
        patientData.profile.occupation = formData.occupation.trim();
      }

      // Add referral code if validated
      if (referralValidated && referralCode) {
        patientData.referredBy = referralCode;
      }

      console.log('Submitting patient data:', patientData); // Debug log

      const response = await api.post('/patients', patientData);
      
      if (response.data.success) {
        // If referral code was used, apply the referral
        if (referralValidated && referralCode) {
          try {
            await api.post('/referral/apply', {
              referralCode: referralCode,
              newPatientId: response.data.patient._id,
            });
            showNotification('เพิ่มผู้ป่วยใหม่สำเร็จ และนำรหัสแนะนำไปใช้แล้ว', 'success');
          } catch (refError) {
            console.error('Error applying referral:', refError);
            showNotification('เพิ่มผู้ป่วยสำเร็จ แต่ไม่สามารถนำรหัสแนะนำไปใช้ได้', 'warning');
          }
        } else {
          showNotification('เพิ่มผู้ป่วยใหม่สำเร็จ', 'success');
        }
        
        fetchPatients(); // Refresh list
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error adding patient:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถเพิ่มผู้ป่วยได้', 'error');
    }
  };

  const handleValidateReferralCode = async () => {
    if (!referralCode || referralCode.trim() === '') {
      setReferralMessage('กรุณากรอกรหัสแนะนำ');
      setReferralValidated(false);
      return;
    }

    try {
      const response = await api.post('/referral/validate', {
        referralCode: referralCode.toUpperCase(),
      });

      if (response.data.valid) {
        setReferralValidated(true);
        setReferralMessage(`✓ รหัสแนะนำถูกต้อง - จาก ${response.data.referrer.name}`);
        showNotification('รหัสแนะนำถูกต้อง', 'success');
      } else {
        setReferralValidated(false);
        setReferralMessage('รหัสแนะนำไม่ถูกต้อง');
        showNotification('รหัสแนะนำไม่ถูกต้อง', 'error');
      }
    } catch (error: any) {
      console.error('Error validating referral code:', error);
      setReferralValidated(false);
      setReferralMessage('ไม่สามารถตรวจสอบรหัสแนะนำได้');
      showNotification('ไม่สามารถตรวจสอบรหัสแนะนำได้', 'error');
    }
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;
    
    try {
      const patientData = {
        profile: {
          firstName: formData.name?.split(' ')[0] || selectedPatient.name.split(' ')[0],
          lastName: formData.name?.split(' ').slice(1).join(' ') || selectedPatient.name.split(' ').slice(1).join(' '),
          nickname: formData.nickname || selectedPatient.nickname,
          dateOfBirth: formData.birthDate || selectedPatient.birthDate,
          gender: (formData.gender || selectedPatient.gender) === 'ชาย' ? 'male' : 'female',
          occupation: formData.occupation || selectedPatient.occupation,
          contact: {
            phone: formData.phone || selectedPatient.phone,
            email: formData.email || selectedPatient.email,
          },
          address: {
            current: {
              street: formData.address || selectedPatient.address,
            },
          },
        },
      };

      const response = await api.put(`/patients/${selectedPatient.id}`, patientData);
      
      if (response.data.success) {
        showNotification('อัปเดตข้อมูลผู้ป่วยสำเร็จ', 'success');
        fetchPatients(); // Refresh list
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error updating patient:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
    }
  };

  const handleUpdatePoints = async () => {
    if (!selectedPatient) return;

    try {
      const response = await api.post('/loyalty/points', {
        patientId: selectedPatient.id,
        points: pointsToAdd,
      });

      if (response.data.loyaltyPoints !== undefined) {
        showNotification(`อัปเดตแต้มสะสมสำเร็จ เป็น ${response.data.loyaltyPoints} แต้ม`, 'success');
        fetchPatients(); // Refresh list
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error updating points:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถอัปเดตแต้มได้', 'error');
    }
  };

  const handleEnablePortal = async () => {
    if (!selectedPatient || !portalPassword) {
      showNotification('กรุณากรอกรหัสผ่าน', 'warning');
      return;
    }

    if (portalPassword.length < 6) {
      showNotification('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'warning');
      return;
    }

    try {
      const response = await api.post('/portal/register', {
        patientId: selectedPatient.id,
        password: portalPassword,
      });

      showNotification(`เปิดใช้งาน Portal สำเร็จสำหรับ ${selectedPatient.name}`, 'success');
      closeDialog();
    } catch (error: any) {
      console.error('Error enabling portal:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถเปิดใช้งาน Portal ได้', 'error');
    }
  };

  const getMembershipColor = (membership: string) => {
    switch (membership) {
      case 'Silver': return 'default';
      case 'Gold': return 'warning';
      case 'Platinum': return 'info';
      case 'Diamond': return 'success';
      default: return 'default';
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.hn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  // Loading state
  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลผู้ป่วย..." fullPage />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.background.default} 100%)`,
        py: 3,
      }}
    >
      <Container maxWidth="xl">
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
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaceRetouchingNatural sx={{ mr: 2, fontSize: 40, color: theme.palette.primary.main }} />
            ผู้ป่วย & CRM
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            จัดการข้อมูลผู้ป่วยและระบบ CRM
          </Typography>
        </Box>

        {/* Stats Cards */}
        <GridItem xs={12} sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Card sx={{ flex: 1, borderRadius: 3, boxShadow: theme.shadows[4] }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: `${theme.palette.primary.main}15`,
                      color: theme.palette.primary.main,
                    }}
                  >
                    <Person sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                      {patients.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ผู้ป่วยทั้งหมด
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, borderRadius: 3, boxShadow: theme.shadows[4] }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: `${theme.palette.success.main}15`,
                      color: theme.palette.success.main,
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                      {patients.filter(p => p.lastVisit >= '2024-01-01').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      มาใช้บริการปีนี้
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, borderRadius: 3, boxShadow: theme.shadows[4] }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: `${theme.palette.warning.main}15`,
                      color: theme.palette.warning.main,
                    }}
                  >
                    <LocationOn sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                      {patients.filter(p => p.membership === 'Diamond' || p.membership === 'Platinum').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      สมาชิก VIP
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </GridItem>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label="รายการผู้ป่วย" 
              icon={<Person />} 
              iconPosition="start"
            />
            <Tab 
              label="เพิ่มผู้ป่วยใหม่" 
              icon={<Add />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
        <Box>
          {/* Search and Filter Section */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: theme.shadows[2] }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="ค้นหาผู้ป่วย (ชื่อ, HN, หรือเบอร์โทร)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    )
                  }}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    sx={{ minWidth: 120, borderRadius: 2 }}
                  >
                    กรองข้อมูล
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    sx={{ 
                      minWidth: 150, 
                      borderRadius: 2,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      },
                    }}
                    onClick={() => openDialog('add')}
                  >
                    เพิ่มผู้ป่วย
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Patients Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ผู้ป่วย</TableCell>
                    <TableCell>HN</TableCell>
                    <TableCell>ติดต่อ</TableCell>
                    <TableCell>อายุ</TableCell>
                    <TableCell>สมาชิก</TableCell>
                    <TableCell>การใช้จ่าย</TableCell>
                    <TableCell>แต้มสะสม</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {patient.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {patient.nickname}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {patient.hn}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Box display="flex" alignItems="center">
                            <Phone sx={{ mr: 1, fontSize: 16 }} />
                            <Typography variant="caption">{patient.phone}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center">
                            <Email sx={{ mr: 1, fontSize: 16 }} />
                            <Typography variant="caption">{patient.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{patient.age} ปี</TableCell>
                      <TableCell>
                        <Chip
                          label={patient.membership}
                          color={getMembershipColor(patient.membership) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          ฿{patient.totalSpending.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {patient.loyaltyPoints} แต้ม
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => openDialog('view', patient)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => openDialog('edit', patient)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ color: theme.palette.warning.main }}
                            onClick={() => openDialog('points', patient)}
                          >
                            <Star />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ color: theme.palette.info.main }}
                            onClick={() => openDialog('portal', patient)}
                            title="เปิดใช้งาน Portal"
                          >
                            <VpnKey />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>เพิ่มผู้ป่วยใหม่</Typography>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="ชื่อ-นามสกุล"
                  placeholder="กรอกชื่อเต็ม"
                />
                <TextField
                  fullWidth
                  label="ชื่อเล่น"
                  placeholder="ชื่อเล่น"
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="เบอร์โทรศัพท์"
                  placeholder="081-234-5678"
                />
                <TextField
                  fullWidth
                  label="อีเมล"
                  placeholder="example@email.com"
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="วันเกิด"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth>
                  <InputLabel>เพศ</InputLabel>
                  <Select defaultValue="">
                    <MenuItem value="ชาย">ชาย</MenuItem>
                    <MenuItem value="หญิง">หญิง</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <TextField
                fullWidth
                label="ที่อยู่"
                multiline
                rows={3}
                placeholder="กรอกที่อยู่เต็ม"
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined">ยกเลิก</Button>
                <Button variant="contained">บันทึก</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Patient Detail Dialog */}
      <Dialog open={dialogOpen && dialogType === 'view'} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              👤 ข้อมูลผู้ป่วย - {selectedPatient?.name}
            </Typography>
            <IconButton onClick={closeDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>ข้อมูลส่วนตัว</Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={4}>
                    <Box flex={1}>
                      <Typography variant="subtitle2" color="text.secondary">HN</Typography>
                      <Typography variant="body1" fontWeight="bold">{selectedPatient.hn}</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle2" color="text.secondary">ชื่อ-นามสกุล</Typography>
                      <Typography variant="body1">{selectedPatient.name}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={4}>
                    <Box flex={1}>
                      <Typography variant="subtitle2" color="text.secondary">เบอร์โทร</Typography>
                      <Typography variant="body1">{selectedPatient.phone}</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle2" color="text.secondary">อีเมล</Typography>
                      <Typography variant="body1">{selectedPatient.email}</Typography>
                    </Box>
                  </Stack>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">ที่อยู่</Typography>
                    <Typography variant="body1">{selectedPatient.address}</Typography>
                  </Box>
                </Stack>
              </Box>
              
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>สมาชิกและการใช้จ่าย</Typography>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">ระดับสมาชิก</Typography>
                    <Chip
                      label={selectedPatient.membership}
                      color={getMembershipColor(selectedPatient.membership) as any}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">การใช้จ่ายรวม</Typography>
                    <Typography variant="h6" color="primary.main">
                      ฿{selectedPatient.totalSpending.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">แต้มสะสม</Typography>
                    <Typography variant="h6" color="success.main">
                      {selectedPatient.loyaltyPoints} แต้ม
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Star />}
                    onClick={() => openDialog('points', selectedPatient)}
                  >
                    จัดการแต้ม
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ปิด</Button>
          <Button variant="contained" onClick={() => openDialog('edit', selectedPatient!)}>
            แก้ไข
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={dialogOpen && dialogType === 'edit'} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>แก้ไขข้อมูลผู้ป่วย - {selectedPatient?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="ชื่อ-นามสกุล"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="ชื่อเล่น"
                value={formData.nickname || ''}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="เบอร์โทรศัพท์"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <TextField
                fullWidth
                label="อีเมล"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="วันเกิด"
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>เพศ</InputLabel>
                <Select 
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value="ชาย">ชาย</MenuItem>
                  <MenuItem value="หญิง">หญิง</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              fullWidth
              label="ที่อยู่"
              multiline
              rows={2}
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <TextField
              fullWidth
              label="อาชีพ"
              value={formData.occupation || ''}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleUpdatePatient}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Points Dialog */}
      <Dialog open={dialogOpen && dialogType === 'points'} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>จัดการแต้มสะสม - {selectedPatient?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography>
              แต้มปัจจุบัน: <strong>{selectedPatient?.loyaltyPoints}</strong>
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="เพิ่ม/ลด แต้ม"
              type="number"
              fullWidth
              variant="outlined"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(parseInt(e.target.value, 10) || 0)}
              helperText="ใส่ค่าบวกเพื่อเพิ่มแต้ม หรือค่าลบเพื่อลดแต้ม"
            />
            <Typography>
              แต้มใหม่: <strong>{(selectedPatient?.loyaltyPoints || 0) + pointsToAdd}</strong>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleUpdatePoints}>
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enable Portal Dialog */}
      <Dialog open={dialogOpen && dialogType === 'portal'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VpnKey sx={{ mr: 1 }} />
            เปิดใช้งาน Patient Portal - {selectedPatient?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Patient Portal ช่วยให้ผู้ป่วยสามารถเข้าดูข้อมูลส่วนตัว คะแนนสะสม ประวัติการรักษา และนัดหมายได้ด้วยตนเอง
            </Alert>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                ข้อมูลสำหรับเข้าสู่ระบบ:
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>HN:</strong> {selectedPatient?.hn}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  ผู้ป่วยจะใช้ HN และรหัสผ่านที่ตั้งไว้เพื่อเข้าสู่ระบบที่ /portal/login
                </Typography>
              </Box>
            </Box>
            <TextField
              autoFocus
              label="ตั้งรหัสผ่าน"
              type="password"
              fullWidth
              variant="outlined"
              value={portalPassword}
              onChange={(e) => setPortalPassword(e.target.value)}
              helperText="รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleEnablePortal} startIcon={<VpnKey />}>
            เปิดใช้งาน Portal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={dialogOpen && dialogType === 'add'} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>เพิ่มผู้ป่วยใหม่</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="ชื่อ-นามสกุล"
                placeholder="กรอกชื่อเต็ม"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="ชื่อเล่น"
                placeholder="ชื่อเล่น"
                value={formData.nickname || ''}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="เบอร์โทรศัพท์"
                placeholder="081-234-5678"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <TextField
                fullWidth
                label="อีเมล"
                placeholder="example@email.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="วันเกิด"
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>เพศ</InputLabel>
                <Select 
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value="ชาย">ชาย</MenuItem>
                  <MenuItem value="หญิง">หญิง</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              fullWidth
              label="ที่อยู่"
              multiline
              rows={2}
              placeholder="ระบุที่อยู่"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <TextField
              fullWidth
              label="อาชีพ"
              placeholder="ระบุอาชีพ"
              value={formData.occupation || ''}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>ระดับสมาชิก</InputLabel>
              <Select 
                value={formData.membership || 'Silver'}
                onChange={(e) => setFormData({ ...formData, membership: e.target.value as any })}
              >
                <MenuItem value="Silver">Silver</MenuItem>
                <MenuItem value="Gold">Gold</MenuItem>
                <MenuItem value="Platinum">Platinum</MenuItem>
                <MenuItem value="Diamond">Diamond</MenuItem>
              </Select>
            </FormControl>

            {/* Referral Code Section */}
            <Box sx={{ 
              border: '2px dashed', 
              borderColor: referralValidated ? 'success.main' : 'divider', 
              borderRadius: 2, 
              p: 2,
              bgcolor: referralValidated ? 'success.50' : 'grey.50'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                มีรหัสแนะนำจากเพื่อนหรือไม่?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                ใช้รหัสแนะนำเพื่อรับแต้มสะสมพิเศษ!
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="รหัสแนะนำ"
                  placeholder="กรอกรหัสแนะนำ (ถ้ามี)"
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value.toUpperCase());
                    setReferralValidated(false);
                    setReferralMessage('');
                  }}
                  disabled={referralValidated}
                  InputProps={{
                    sx: { textTransform: 'uppercase' }
                  }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleValidateReferralCode}
                  disabled={referralValidated || !referralCode}
                >
                  ตรวจสอบ
                </Button>
              </Stack>
              {referralMessage && (
                <Alert 
                  severity={referralValidated ? 'success' : 'error'} 
                  sx={{ mt: 1 }}
                >
                  {referralMessage}
                </Alert>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleAddPatient}>
            เพิ่มผู้ป่วย
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default Patients;