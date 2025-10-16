import React, { useState } from 'react';
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

const sampleTreatments: Treatment[] = [
  {
    id: '1',
    patientName: 'สมศรี ใจดี',
    patientHN: 'HN001',
    service: 'Botox Facial',
    date: '2024-01-15',
    time: '09:00',
    doctor: 'ดร.สุรพล',
    status: 'completed',
    cost: 15000,
    notes: 'การรักษาผลลัพธ์ดี ผู้ป่วยพึงพอใจ'
  },
  {
    id: '2',
    patientName: 'วิไล สวยงาม',
    patientHN: 'HN002',
    service: 'Laser Hair Removal',
    date: '2024-01-15',
    time: '10:30',
    doctor: 'ดร.สุนิสา',
    status: 'in-progress',
    cost: 8000,
    notes: 'เซสชั่นที่ 3 จาก 6 เซสชั่น'
  },
  {
    id: '3',
    patientName: 'มานะ ขยันดี',
    patientHN: 'HN003',
    service: 'Acne Treatment',
    date: '2024-01-15',
    time: '14:00',
    doctor: 'ดร.สุรพล',
    status: 'scheduled',
    cost: 3500,
    notes: 'การรักษาสิว รอบที่ 2'
  },
];

const Treatments: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [treatments] = useState<Treatment[]>(sampleTreatments);
  const [searchTerm, setSearchTerm] = useState('');

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
        </Box>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>เพิ่มการรักษาใหม่</Typography>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="HN ผู้ป่วย"
                  placeholder="ระบุ HN ผู้ป่วย"
                />
                <TextField
                  fullWidth
                  label="บริการ"
                  placeholder="เลือกบริการ"
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="วันที่"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="เวลา"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <TextField
                fullWidth
                label="หมายเหตุ"
                multiline
                rows={3}
                placeholder="บันทึกเพิ่มเติม"
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined">ยกเลิก</Button>
                <Button variant="contained">บันทึก</Button>
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