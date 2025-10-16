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
  TextField,
  Chip,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Badge,
  Container,
  Alert,
} from '@mui/material';
import {
  Add,
  Search,
  Person,
  Edit,
  Block,
  CheckCircle,
  Schedule,
  Security,
  Phone,
  Email,
  Work,
  AdminPanelSettings,
  LocalHospital,
  RecordVoiceOver,
  PersonAdd,
  Star,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';
import { LoadingState, EmptyState } from '../components/common/States';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Staff: React.FC = () => {
  const { showNotification } = useNotifications();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [staffSchedule, setStaffSchedule] = useState<any>(null);
  const [staffPermissions, setStaffPermissions] = useState<string[]>([]);
  const [evaluationScores, setEvaluationScores] = useState({
    workQuality: 4,
    responsibility: 4,
    teamwork: 4,
    customerService: 4,
    comments: ''
  });
  const [dialogType, setDialogType] = useState<'view' | 'add' | 'edit'>('view');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/staff');
      
      // Transform backend data
      const transformedStaff = response.data.data.map((s: any) => ({
        id: s._id,
        employeeId: s.employeeId,
        name: `${s.profile.firstName} ${s.profile.lastName}`,
        role: s.role,
        department: s.department || '-',
        email: s.email,
        phone: s.profile.phone,
        status: s.isActive ? 'active' : 'inactive',
        permissions: s.permissions?.map((p: any) => p.module) || [],
        schedule: s.schedule?.workingDays || [],
        lastSeen: s.updatedAt,
      }));
      
      setStaff(transformedStaff);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลพนักงานได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setDialogType('add');
    setFormData({});
    setOpenDialog(true);
  };

  const openEditDialog = (staffMember: any) => {
    setDialogType('edit');
    setSelectedStaff(staffMember);
    setFormData({
      firstName: staffMember.name.split(' ')[0],
      lastName: staffMember.name.split(' ').slice(1).join(' '),
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      department: staffMember.department,
    });
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setSelectedStaff(null);
    setFormData({});
    setTabValue(0);
  };

  const handleAddStaff = async () => {
    try {
      const staffData = {
        employeeId: formData.employeeId || `EMP${Date.now()}`,
        username: formData.username || formData.email?.split('@')[0],
        email: formData.email,
        password: formData.password || 'changeme123',
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        role: formData.role || 'receptionist',
        department: formData.department,
      };

      const response = await api.post('/staff', staffData);
      
      if (response.data.success) {
        showNotification('เพิ่มพนักงานสำเร็จ', 'success');
        fetchStaff();
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error adding staff:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถเพิ่มพนักงานได้', 'error');
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      const staffData = {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        role: formData.role,
        department: formData.department,
      };

      const response = await api.put(`/api/staff/${selectedStaff.id}`, staffData);
      
      if (response.data.success) {
        showNotification('อัปเดตข้อมูลพนักงานสำเร็จ', 'success');
        fetchStaff();
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error updating staff:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
    }
  };

  const fetchSchedule = async (staffId: string) => {
    try {
      const response = await api.get(`/api/staff/${staffId}/schedule`);
      if (response.data.success) {
        setStaffSchedule(response.data.data.schedule);
      }
    } catch (error: any) {
      console.error('Error fetching schedule:', error);
      showNotification('ไม่สามารถดึงข้อมูลตารางงานได้', 'error');
    }
  };

  const updateSchedule = async (staffId: string, schedule: any) => {
    try {
      const response = await api.put(`/api/staff/${staffId}/schedule`, { schedule });
      if (response.data.success) {
        showNotification('บันทึกตารางงานสำเร็จ', 'success');
        setScheduleDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถบันทึกตารางงานได้', 'error');
    }
  };

  const fetchPermissions = async (staffId: string) => {
    try {
      const response = await api.get(`/api/staff/${staffId}/permissions`);
      if (response.data.success) {
        setStaffPermissions(response.data.data.permissions);
      }
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      showNotification('ไม่สามารถดึงข้อมูลสิทธิ์ได้', 'error');
    }
  };

  const updatePermissions = async (staffId: string, permissions: string[]) => {
    try {
      const response = await api.put(`/api/staff/${staffId}/permissions`, { permissions });
      if (response.data.success) {
        showNotification('บันทึกสิทธิ์การเข้าถึงสำเร็จ', 'success');
        setPermissionsDialogOpen(false);
        fetchStaff();
      }
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถบันทึกสิทธิ์ได้', 'error');
    }
  };

  const submitEvaluation = async (staffId: string) => {
    try {
      const response = await api.post(`/api/staff/${staffId}/evaluations`, evaluationScores);
      if (response.data.success) {
        showNotification('บันทึกผลการประเมินสำเร็จ', 'success');
        setEvaluationDialogOpen(false);
        setEvaluationScores({
          workQuality: 4,
          responsibility: 4,
          teamwork: 4,
          customerService: 4,
          comments: ''
        });
      }
    } catch (error: any) {
      console.error('Error submitting evaluation:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถบันทึกการประเมินได้', 'error');
    }
  };

  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staffMember.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staffMember.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || staffMember.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || staffMember.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'primary';
      case 'nurse': return 'secondary';
      case 'receptionist': return 'info';
      case 'manager': return 'warning';
      case 'admin': return 'error';
      default: return 'default';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'doctor': return 'แพทย์';
      case 'nurse': return 'พยาบาล';
      case 'receptionist': return 'แผนกต้อนรับ';
      case 'manager': return 'ผู้จัดการ';
      case 'admin': return 'ผู้ดูแลระบบ';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return <LocalHospital />;
      case 'nurse': return <RecordVoiceOver />;
      case 'receptionist': return <Person />;
      case 'manager': return <Work />;
      case 'admin': return <AdminPanelSettings />;
      default: return <Person />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'ปฏิบัติงาน';
      case 'inactive': return 'หยุดงาน';
      case 'suspended': return 'ถูกระงับ';
      default: return status;
    }
  };

  const activeStaff = staff.filter(s => s.status === 'active').length;
  const onlineStaff = 0; // TODO: implement real-time status
  const doctorCount = staff.filter(s => s.role === 'doctor').length;

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลพนักงาน..." fullPage />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          👥 จัดการเจ้าหน้าที่
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={openAddDialog}
        >
          เพิ่มพนักงาน
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{staff.length}</Typography>
            <Typography variant="body2">พนักงานทั้งหมด</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{activeStaff}</Typography>
            <Typography variant="body2">ปฏิบัติงาน</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">{onlineStaff}</Typography>
            <Typography variant="body2">ออนไลน์</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{doctorCount}</Typography>
            <Typography variant="body2">แพทย์</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="ค้นหาพนักงาน (ชื่อ, รหัสพนักงาน, อีเมล)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl>
              <InputLabel>ตำแหน่ง</InputLabel>
              <Select
                value={roleFilter}
                label="ตำแหน่ง"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="doctor">แพทย์</MenuItem>
                <MenuItem value="nurse">พยาบาล</MenuItem>
                <MenuItem value="receptionist">แผนกต้อนรับ</MenuItem>
                <MenuItem value="manager">ผู้จัดการ</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={statusFilter}
                label="สถานะ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="active">ปฏิบัติงาน</MenuItem>
                <MenuItem value="inactive">หยุดงาน</MenuItem>
                <MenuItem value="suspended">ถูกระงับ</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="outlined" 
              onClick={() => setScheduleDialogOpen(true)}
              startIcon={<Schedule />}
            >
              ตารางงาน
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📋 รายชื่อเจ้าหน้าที่
          </Typography>
          {filteredStaff.length === 0 ? (
            <EmptyState
              title="ไม่พบข้อมูลพนักงาน"
              message={searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? "ไม่พบข้อมูลพนักงานที่ตรงกับการค้นหา ลองเปลี่ยนเงื่อนไขการค้นหา" 
                : "ยังไม่มีข้อมูลพนักงานในระบบ เริ่มต้นเพิ่มพนักงานใหม่"}
              action={
                (searchTerm || roleFilter !== 'all' || statusFilter !== 'all') ? undefined : (
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={openAddDialog}
                  >
                    เพิ่มพนักงาน
                  </Button>
                )
              }
            />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>พนักงาน</TableCell>
                    <TableCell>รหัสพนักงาน</TableCell>
                    <TableCell>ตำแหน่ง</TableCell>
                    <TableCell>แผนก</TableCell>
                    <TableCell>ติดต่อ</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>ออนไลน์</TableCell>
                    <TableCell>การดำเนินการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Badge
                          color={staff.isOnline ? 'success' : 'default'}
                          variant="dot"
                          sx={{ mr: 2 }}
                        >
                          <Avatar sx={{ bgcolor: getRoleColor(staff.role) + '.light' }}>
                            {getRoleIcon(staff.role)}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {staff.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            เข้าร่วมงาน: {new Date(staff.joinDate).toLocaleDateString('th-TH')}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{staff.employeeId}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoleText(staff.role)} 
                        size="small" 
                        color={getRoleColor(staff.role)}
                      />
                    </TableCell>
                    <TableCell>{staff.department}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Phone sx={{ fontSize: 16, mr: 0.5 }} />
                          {staff.phone}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email sx={{ fontSize: 12, mr: 0.5 }} />
                          {staff.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(staff.status)}
                        size="small"
                        color={getStatusColor(staff.status)}
                        icon={staff.status === 'active' ? <CheckCircle /> : 
                              staff.status === 'suspended' ? <Block /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={staff.isOnline ? 'success.main' : 'text.secondary'}>
                        {staff.isOnline ? 'ออนไลน์' : `ออฟไลน์ ${staff.lastSeen}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDialogType('view');
                            setSelectedStaff(staff);
                            setOpenDialog(true);
                          }}
                          color="info"
                        >
                          <Person />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(staff)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedStaff(staff);
                            fetchPermissions(staff.id);
                            setPermissionsDialogOpen(true);
                          }}
                          color="secondary"
                        >
                          <Security />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ⚡ การดำเนินการด่วน
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
              onClick={openAddDialog}
              sx={{ flex: 1 }}
            >
              เพิ่มพนักงานใหม่
            </Button>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => setScheduleDialogOpen(true)}
              sx={{ flex: 1 }}
            >
              จัดตารางงาน
            </Button>
            <Button
              variant="outlined"
              startIcon={<Security />}
              onClick={() => setPermissionsDialogOpen(true)}
              sx={{ flex: 1 }}
            >
              จัดการสิทธิ์
            </Button>
            <Button
              variant="outlined"
              startIcon={<Work />}
              onClick={() => setEvaluationDialogOpen(true)}
              sx={{ flex: 1 }}
            >
              ประเมินผลงาน
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Staff Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>รายละเอียดพนักงาน</DialogTitle>
        <DialogContent>
          {selectedStaff && (
            <Box>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="ข้อมูลทั่วไป" />
                <Tab label="ตารางงาน" />
                <Tab label="สิทธิ์การใช้งาน" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      ข้อมูลส่วนตัว
                    </Typography>
                    <Typography>ชื่อ: {selectedStaff.name}</Typography>
                    <Typography>รหัสพนักงาน: {selectedStaff.employeeId}</Typography>
                    <Typography>ตำแหน่ง: {getRoleText(selectedStaff.role)}</Typography>
                    <Typography>แผนก: {selectedStaff.department}</Typography>
                    <Typography>สถานะ: {getStatusText(selectedStaff.status)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      ข้อมูลติดต่อ
                    </Typography>
                    <Typography>โทรศัพท์: {selectedStaff.phone}</Typography>
                    <Typography>อีเมล: {selectedStaff.email}</Typography>
                    <Typography>เข้าร่วมงาน: {new Date(selectedStaff.joinDate).toLocaleDateString('th-TH')}</Typography>
                    <Typography>สถานะออนไลน์: {selectedStaff.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}</Typography>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  ตารางการทำงาน
                </Typography>
                <Typography>{selectedStaff.schedule}</Typography>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  สิทธิ์การใช้งานระบบ
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedStaff.permissions.includes('*') ? (
                    <Chip label="สิทธิ์ผู้ดูแลระบบ (เข้าถึงได้ทุกฟังก์ชัน)" color="error" />
                  ) : (
                    selectedStaff.permissions.map((permission: string) => (
                      <FormControlLabel
                        key={permission}
                        control={<Switch checked={true} disabled />}
                        label={permission}
                      />
                    ))
                  )}
                </Box>
              </TabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ปิด</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setOpenDialog(false);
              if (selectedStaff) {
                openEditDialog(selectedStaff);
              }
            }}
          >
            แก้ไข
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Staff Dialog */}
      <Dialog 
        open={dialogType === 'add' || dialogType === 'edit'} 
        onClose={closeDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'add' ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูลพนักงาน'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="ชื่อ"
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="นามสกุล"
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="อีเมล"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="เบอร์โทรศัพท์"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            {dialogType === 'add' && (
              <>
                <TextField
                  label="รหัสพนักงาน"
                  value={formData.employeeId || ''}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  fullWidth
                  helperText="เว้นว่างเพื่อสร้างอัตโนมัติ"
                />
                <TextField
                  label="ชื่อผู้ใช้ (Username)"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  fullWidth
                  helperText="เว้นว่างเพื่อใช้ส่วนหน้าอีเมล"
                />
                <TextField
                  label="รหัสผ่าน"
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  fullWidth
                  helperText="เว้นว่างเพื่อใช้รหัสผ่านเริ่มต้น (changeme123)"
                />
              </>
            )}
            <TextField
              select
              label="ตำแหน่ง"
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              fullWidth
              required
            >
              <MenuItem value="doctor">แพทย์</MenuItem>
              <MenuItem value="nurse">พยาบาล</MenuItem>
              <MenuItem value="receptionist">พนักงานต้อนรับ</MenuItem>
              <MenuItem value="admin">ผู้ดูแลระบบ</MenuItem>
            </TextField>
            <TextField
              label="แผนก"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            onClick={dialogType === 'add' ? handleAddStaff : handleUpdateStaff}
          >
            {dialogType === 'add' ? 'เพิ่ม' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog 
        open={scheduleDialogOpen} 
        onClose={() => setScheduleDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>📅 จัดตารางงาน</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              กำหนดเวลาทำงานของพนักงานแต่ละคน
            </Alert>

            {/* Week Schedule */}
            <Typography variant="h6" sx={{ mb: 2 }}>ตารางงานรายสัปดาห์</Typography>
            <Stack spacing={2}>
              {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day) => (
                <Box key={day} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ width: 100 }}>{day}</Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="ทำงาน"
                  />
                  <TextField
                    size="small"
                    type="time"
                    label="เวลาเข้า"
                    defaultValue="09:00"
                    sx={{ width: 150 }}
                  />
                  <TextField
                    size="small"
                    type="time"
                    label="เวลาออก"
                    defaultValue="18:00"
                    sx={{ width: 150 }}
                  />
                </Box>
              ))}
            </Stack>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>พนักงานทั้งหมด</Typography>
            <Stack spacing={1}>
              {staff.map((s) => (
                <Box 
                  key={s.id} 
                  sx={{ 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography fontWeight="bold">{s.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.role} - {s.department}
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    onClick={() => {
                      setSelectedStaff(s);
                      fetchSchedule(s.id);
                    }}
                  >
                    ตั้งค่า
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>ปิด</Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (selectedStaff && staffSchedule) {
                updateSchedule(selectedStaff.id, staffSchedule);
              } else {
                showNotification('กรุณาเลือกพนักงานและกำหนดตารางงาน', 'warning');
              }
            }}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog 
        open={permissionsDialogOpen} 
        onClose={() => setPermissionsDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>🔐 จัดการสิทธิ์การเข้าถึง</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedStaff && (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {selectedStaff.name} - {getRoleText(selectedStaff.role)}
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  กำหนดสิทธิ์การเข้าถึงเมนูและฟังก์ชันต่างๆ
                </Alert>

                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="ดูข้อมูลผู้ป่วย"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="แก้ไขข้อมูลผู้ป่วย"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="จัดการนัดหมาย"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="บันทึกการรักษา"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="ดูรายงานทางการเงิน"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="จัดการสินค้าคงคลัง"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="จัดการพนักงาน"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="ตั้งค่าระบบ (Admin)"
                  />
                </Stack>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (selectedStaff) {
                updatePermissions(selectedStaff.id, staffPermissions);
              }
            }}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog 
        open={evaluationDialogOpen} 
        onClose={() => setEvaluationDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>⭐ ประเมินผลงานพนักงาน</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              ประเมินผลการทำงานและให้คะแนนพนักงาน
            </Alert>

            <Stack spacing={3}>
              {/* Select Staff */}
              <FormControl fullWidth>
                <InputLabel>เลือกพนักงาน</InputLabel>
                <Select
                  value={selectedStaff?.id || ''}
                  label="เลือกพนักงาน"
                  onChange={(e) => {
                    const s = staff.find(st => st.id === e.target.value);
                    setSelectedStaff(s);
                  }}
                >
                  {staff.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} - {getRoleText(s.role)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedStaff && (
                <>
                  {/* Evaluation Criteria */}
                  <Typography variant="h6">เกณฑ์การประเมิน</Typography>
                  
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>คุณภาพการทำงาน</Typography>
                    <Stack direction="row" spacing={1}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconButton key={star} color="warning">
                          <Star />
                        </IconButton>
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>ความรับผิดชอบ</Typography>
                    <Stack direction="row" spacing={1}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconButton key={star} color="warning">
                          <Star />
                        </IconButton>
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>การทำงานเป็นทีม</Typography>
                    <Stack direction="row" spacing={1}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconButton key={star} color="warning">
                          <Star />
                        </IconButton>
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>การบริการลูกค้า</Typography>
                    <Stack direction="row" spacing={1}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconButton key={star} color="warning">
                          <Star />
                        </IconButton>
                      ))}
                    </Stack>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="ความคิดเห็นและข้อเสนอแนะ"
                    placeholder="ระบุจุดเด่น จุดที่ควรพัฒนา และข้อเสนอแนะ"
                  />

                  {/* Summary Card */}
                  <Card sx={{ bgcolor: 'primary.light', mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary.contrastText">สรุปคะแนนรวม</Typography>
                      <Typography variant="h3" fontWeight="bold" color="primary.contrastText">
                        4.5 / 5.0
                      </Typography>
                      <Typography variant="body2" color="primary.contrastText">
                        ระดับ: ดีมาก
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluationDialogOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (selectedStaff) {
                submitEvaluation(selectedStaff.id);
              }
            }}
            disabled={!selectedStaff}
          >
            บันทึกการประเมิน
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Staff;