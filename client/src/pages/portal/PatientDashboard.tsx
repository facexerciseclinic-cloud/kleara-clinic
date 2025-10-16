import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  Stack,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Star,
  CalendarToday,
  Receipt,
  ExitToApp,
  Person,
  Phone,
  Email,
  Share,
  ContentCopy,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import axios from 'axios';

interface PatientProfile {
  hn: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  membershipLevel: string;
  totalSpending: number;
}

interface Appointment {
  _id: string;
  startTime: string;
  endTime: string;
  service: string;
  status: string;
}

interface Bill {
  _id: string;
  date: string;
  total: number;
  paymentMethod: string;
  status: string;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
}

interface ReferralSummary {
  total: number;
  completed: number;
  pending: number;
  totalRewards: number;
}

interface ReferralDetails {
  _id: string;
  referred: {
    name: string;
    phone: string;
  };
  rewardType: string;
  rewardValue: number;
  status: string;
  createdAt: string;
  completedAt?: string;
}

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patient, logout, isAuthenticated } = usePatientAuth();
  
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openShare, setOpenShare] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/portal/login');
      return;
    }
    fetchPatientData();
  }, [isAuthenticated, navigate]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('patientToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Fetch profile
      const profileRes = await axios.get(`${API_URL}/portal/me`, config);
      const patientData = profileRes.data;
      
      setProfile({
        hn: patientData.hn,
        name: `${patientData.profile.firstName} ${patientData.profile.lastName}`,
        phone: patientData.contact.phone,
        email: patientData.contact.email,
        loyaltyPoints: patientData.loyaltyPoints || 0,
        membershipLevel: patientData.membershipInfo?.level || 'Silver',
        totalSpending: patientData.financials?.totalSpending || 0,
      });

      // Fetch appointments
      const appointmentsRes = await axios.get(`${API_URL}/portal/my-appointments`, config);
      setAppointments(appointmentsRes.data.slice(0, 5)); // Latest 5

      // Fetch bills
      const billsRes = await axios.get(`${API_URL}/portal/my-bills`, config);
      setBills(billsRes.data.slice(0, 5)); // Latest 5

      // Fetch referral data
      const referralRes = await axios.get(`${API_URL}/referral/my-code/${profileRes.data._id}`, config);
      setReferralData(referralRes.data);

      // Fetch referral history
      const referralHistoryRes = await axios.get(`${API_URL}/referral/my-referrals/${profileRes.data._id}`, config);
      setReferralHistory(referralHistoryRes.data.referrals || []);
      setReferralSummary(referralHistoryRes.data.summary || null);

      setError('');
    } catch (err: any) {
      console.error('Error fetching patient data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const handleCopyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      alert('คัดลอกรหัสแนะนำแล้ว!');
    }
  };

  const handleCopyReferralLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      alert('คัดลอกลิงก์แนะนำแล้ว!');
    }
  };

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'Diamond': return 'success';
      case 'Platinum': return 'info';
      case 'Gold': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Box sx={{ fontSize: '40px', mr: 2 }}>🏥</Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Patient Portal
              </Typography>
              <Typography variant="subtitle1">
                ยินดีต้อนรับคุณ {profile?.name}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            ออกจากระบบ
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Profile Card */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  fontSize: '40px',
                }}
              >
                <Person sx={{ fontSize: '60px' }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {profile?.name}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={`HN: ${profile?.hn}`} color="primary" />
                  <Chip
                    label={profile?.membershipLevel}
                    color={getMembershipColor(profile?.membershipLevel || 'Silver') as any}
                  />
                </Stack>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">{profile?.phone}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">{profile?.email}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {profile?.loyaltyPoints}
                  </Typography>
                  <Typography variant="subtitle1">แต้มสะสม</Typography>
                </Box>
                <Star sx={{ fontSize: 60, opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    ฿{profile?.totalSpending.toLocaleString()}
                  </Typography>
                  <Typography variant="subtitle1">ยอดใช้จ่ายรวม</Typography>
                </Box>
                <Receipt sx={{ fontSize: 60, opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {appointments.length}
                  </Typography>
                  <Typography variant="subtitle1">นัดหมายล่าสุด</Typography>
                </Box>
                <CalendarToday sx={{ fontSize: 60, opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Referral Program Card */}
        {referralData && (
          <Card sx={{ mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                <Share sx={{ mr: 1 }} />
                แนะนำเพื่อน รับรางวัล!
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                แชร์รหัสแนะนำของคุณให้เพื่อนๆ เมื่อเพื่อนสมัครและใช้บริการ คุณจะได้รับแต้มสะสม!
              </Typography>

              <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>รหัสแนะนำของคุณ:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 2 }}>
                    {referralData.referralCode}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={handleCopyReferralCode}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.3)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' }
                    }}
                  >
                    คัดลอก
                  </Button>
                </Box>
              </Box>

              {referralSummary && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{referralSummary.total}</Typography>
                    <Typography variant="caption">เพื่อนทั้งหมด</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{referralSummary.completed}</Typography>
                    <Typography variant="caption">สำเร็จแล้ว</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{referralSummary.totalRewards}</Typography>
                    <Typography variant="caption">แต้มที่ได้รับ</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                นัดหมายล่าสุด
              </Typography>
              <Divider sx={{ mb: 2 }} />
                {appointments.length > 0 ? (
                  <List>
                    {appointments.map((apt) => (
                      <ListItem key={apt._id} divider>
                        <ListItemText
                          primary={apt.service || 'บริการทั่วไป'}
                          secondary={new Date(apt.startTime).toLocaleString('th-TH')}
                        />
                        <Chip label={apt.status} size="small" />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">ยังไม่มีนัดหมาย</Typography>
                )}
              </CardContent>
            </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                ประวัติการชำระเงิน
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {bills.length > 0 ? (
                <List>
                  {bills.map((bill) => (
                    <ListItem key={bill._id} divider>
                      <ListItemText
                        primary={`฿${bill.total.toLocaleString()}`}
                        secondary={new Date(bill.date).toLocaleDateString('th-TH')}
                      />
                      <Chip label={bill.paymentMethod} size="small" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">ยังไม่มีประวัติการชำระเงิน</Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Referral History */}
        {referralHistory.length > 0 && (
          <Card sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                ประวัติการแนะนำเพื่อน
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {referralHistory.map((ref) => (
                  <ListItem key={ref._id} divider>
                    <ListItemText
                      primary={ref.referred.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {ref.referred.phone}
                          </Typography>
                          {' — '}
                          {new Date(ref.createdAt).toLocaleDateString('th-TH')}
                        </>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip 
                        label={ref.status === 'completed' ? 'สำเร็จ' : ref.status === 'rewarded' ? 'รับรางวัลแล้ว' : 'รอดำเนินการ'} 
                        size="small"
                        color={ref.status === 'rewarded' ? 'success' : ref.status === 'completed' ? 'primary' : 'default'}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        +{ref.rewardValue} {ref.rewardType === 'points' ? 'แต้ม' : 'บาท'}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default PatientDashboard;
