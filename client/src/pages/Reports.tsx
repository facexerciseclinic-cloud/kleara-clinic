// React Core
import React, { useState, useEffect } from 'react';

// Material-UI Components
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

// Services & Contexts
import { api } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { LoadingState, EmptyState } from '../components/common/States';

// Components
import GridItem from '../components/common/GridItem';

// Material-UI Icons
import {
  TrendingUp,
  People,
  CalendarToday,
  Inventory,
  AttachMoney,
  BarChart,
  PieChart,
  Download,
  Print,
  Refresh,
  DateRange,
  Assessment,
  MonetizationOn,
  PersonAdd,
  Event,
  LocalHospital,
  Star,
} from '@mui/icons-material';

// TypeScript Interfaces
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface SalesData {
  month: string;
  revenue: number;
  treatments: number;
  packages: number;
}

interface TopTreatment {
  name: string;
  count: number;
  revenue: number;
  growth: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  revenue: number;
}

interface InventoryAlert {
  item: string;
  stock: number;
  reorder: number;
  status: 'critical' | 'low' | 'ok';
}

// Tab Panel Component
function TabPanel(props: TabPanelProps): React.ReactElement | null {
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

const Reports: React.FC = () => {
  const { showNotification } = useNotifications();
  
  // UI State
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('thisMonth');
  const [reportType, setReportType] = useState('summary');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topTreatments, setTopTreatments] = useState<TopTreatment[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  
  // Summary Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTreatments, setTotalTreatments] = useState(0);
  const [avgRevenue, setAvgRevenue] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);

  // Fetch data on mount and when dateRange changes
  useEffect(() => {
    fetchReportsData();
  }, [dateRange]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data
      const dashboardResponse = await api.get('/reports/dashboard');
      const dashboardData = dashboardResponse.data?.data || dashboardResponse.data;
      
      console.log('Dashboard data:', dashboardData); // Debug log
      
      // Transform sales data from monthly revenue
      if (dashboardData?.monthlyRevenue && Array.isArray(dashboardData.monthlyRevenue)) {
        const transformed = dashboardData.monthlyRevenue.map((item: any) => ({
          month: new Date(item.month).toLocaleDateString('th-TH', { month: 'short' }),
          revenue: item.revenue || 0,
          treatments: item.treatments || 0,
          packages: item.packages || 0,
        }));
        setSalesData(transformed);
        
        // Calculate stats
        const total = transformed.reduce((sum: number, item: any) => sum + item.revenue, 0);
        const totalTx = transformed.reduce((sum: number, item: any) => sum + item.treatments, 0);
        setTotalRevenue(total);
        setTotalTreatments(totalTx);
        setAvgRevenue(transformed.length > 0 ? total / transformed.length : 0);
        
        if (transformed.length >= 2) {
          const growth = ((transformed[transformed.length - 1].revenue - transformed[0].revenue) / transformed[0].revenue) * 100;
          setGrowthRate(growth);
        }
      } else {
        // Set default stats from quickStats if available
        if (dashboardData?.quickStats) {
          setTotalRevenue(dashboardData.quickStats.totalRevenue || 0);
          setTotalTreatments(dashboardData.quickStats.totalTreatments || 0);
        }
        setSalesData([]);
      }
      
      // Fetch analytics data
      try {
        const analyticsResponse = await api.get('/analytics/revenue');
        const analyticsData = analyticsResponse.data?.data || analyticsResponse.data;
        
        if (analyticsData?.topServices && Array.isArray(analyticsData.topServices)) {
          const transformedTreatments = analyticsData.topServices.slice(0, 5).map((item: any) => ({
            name: item.name || item.service,
            count: item.count || 0,
            revenue: item.revenue || 0,
            growth: item.growthRate || 0,
          }));
          setTopTreatments(transformedTreatments);
        }
      } catch (err) {
        console.warn('Analytics revenue endpoint not available:', err);
        setTopTreatments([]);
      }
      
      // Fetch customer segments
      try {
        const customerResponse = await api.get('/analytics/customer-retention');
        const customerData = customerResponse.data?.data || customerResponse.data;
        
        if (customerData?.segments && Array.isArray(customerData.segments)) {
          setCustomerSegments(customerData.segments);
        }
      } catch (err) {
        console.warn('Customer retention endpoint not available:', err);
        setCustomerSegments([]);
      }
      
      // Fetch inventory alerts
      try {
        const inventoryResponse = await api.get('/inventory/alerts');
        const inventoryData = inventoryResponse.data?.data || inventoryResponse.data;
        
        if (Array.isArray(inventoryData)) {
          const transformedAlerts = inventoryData.map((item: any) => {
            const onHand = item.quantity?.onHand || 0;
            const reorderPoint = item.quantity?.reorderPoint || 0;
            let status: 'low' | 'critical' | 'ok' = 'ok';
            
            if (onHand <= reorderPoint * 0.5) {
              status = 'critical';
            } else if (onHand <= reorderPoint) {
              status = 'low';
            }
            
            return {
              item: item.name,
              stock: onHand,
              reorder: reorderPoint,
              status: status,
            };
          });
          setInventoryAlerts(transformedAlerts);
        }
      } catch (err) {
        console.warn('Inventory alerts endpoint not available:', err);
        setInventoryAlerts([]);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch reports data:', error);
      showNotification('ไม่สามารถโหลดข้อมูลรายงานได้ กรุณาลองใหม่อีกครั้ง', 'error');
      
      // Set empty data on error
      setSalesData([]);
      setTopTreatments([]);
      setCustomerSegments([]);
      setInventoryAlerts([]);
      setTotalRevenue(0);
      setTotalTreatments(0);
      setAvgRevenue(0);
      setGrowthRate(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchReportsData();
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลรายงาน..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          📊 รายงานและสถิติ
        </Typography>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>ช่วงเวลา</InputLabel>
            <Select
              value={dateRange}
              label="ช่วงเวลา"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="today">วันนี้</MenuItem>
              <MenuItem value="thisWeek">สัปดาห์นี้</MenuItem>
              <MenuItem value="thisMonth">เดือนนี้</MenuItem>
              <MenuItem value="thisYear">ปีนี้</MenuItem>
              <MenuItem value="custom">กำหนดเอง</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}>
            รีเฟรช
          </Button>
          <Button variant="contained" startIcon={<Download />}>
            ส่งออก
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <GridItem container spacing={3} sx={{ mb: 3 }}>
        <GridItem item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MonetizationOn color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">รายได้รวม</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary">
                ฿{totalRevenue.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +{growthRate.toFixed(1)}% จากเดือนที่แล้ว
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalHospital color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">การรักษารวม</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="secondary">
                {totalTreatments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ครั้ง ใน 6 เดือน
              </Typography>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">ลูกค้าทั้งหมด</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="info">
                {customerSegments.reduce((sum, seg) => sum + seg.count, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +{customerSegments[0].count} ลูกค้าใหม่
              </Typography>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">ค่าเฉลี่ย/เดือน</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="warning">
                ฿{avgRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                รายได้เฉลี่ย
              </Typography>
            </CardContent>
          </Card>
        </GridItem>
      </GridItem>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab icon={<BarChart />} label="รายงานยยอดขาย" />
            <Tab icon={<People />} label="รายงานลูกค้า" />
            <Tab icon={<CalendarToday />} label="รายงานการจอง" />
            <Tab icon={<Inventory />} label="รายงานสินค้าคงคลัง" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Sales Report */}
          <Typography variant="h6" sx={{ mb: 3 }}>💰 รายงานยอดขายและรายได้</Typography>
          
          <GridItem container spacing={3}>
            <GridItem item xs={12} md={8}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>กราฟรายได้รายเดือน</Typography>
                  <Box sx={{ height: 300, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                    <Typography color="text.secondary">📈 กราฟแสดงรายได้รายเดือน</Typography>
                  </Box>
                </CardContent>
              </Card>
            </GridItem>
            <GridItem item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>การรักษายอดนิยม</Typography>
                  {topTreatments.slice(0, 5).map((treatment, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{treatment.name}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {treatment.count} ครั้ง
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(treatment.count / 145) * 100} 
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        ฿{treatment.revenue.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </GridItem>
          </GridItem>

          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>📋 รายละเอียดยอดขายรายเดือน</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>เดือน</TableCell>
                      <TableCell align="right">รายได้</TableCell>
                      <TableCell align="right">การรักษา</TableCell>
                      <TableCell align="right">แพ็คเกจ</TableCell>
                      <TableCell align="right">เฉลี่ย/การรักษา</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesData.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right">฿{row.revenue.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.treatments}</TableCell>
                        <TableCell align="right">{row.packages}</TableCell>
                        <TableCell align="right">
                          ฿{Math.round(row.revenue / row.treatments).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Customer Report */}
          <Typography variant="h6" sx={{ mb: 3 }}>👥 รายงานลูกค้าและการวิเคราะห์</Typography>
          
          <GridItem container spacing={3}>
            <GridItem item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>กลุ่มลูกค้า</Typography>
                  {customerSegments.map((segment, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{segment.segment}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {segment.count} คน ({segment.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={segment.percentage} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        รายได้: ฿{segment.revenue.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </GridItem>
            <GridItem item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>สถิติลูกค้า</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">อัตราลูกค้าใหม่</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        +35% <Typography component="span" variant="body2">เดือนนี้</Typography>
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">อัตราลูกค้ากลับมา</Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        78% <Typography component="span" variant="body2">ย้อนหลัง 6 เดือน</Typography>
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">ค่าเฉลี่ยต่อลูกค้า</Typography>
                      <Typography variant="h5" fontWeight="bold" color="warning.main">
                        ฿5,125 <Typography component="span" variant="body2">ต่อครั้ง</Typography>
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">คะแนนความพึงพอใจ</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="warning.main" sx={{ mr: 1 }}>
                          4.8
                        </Typography>
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} color={star <= 5 ? 'warning' : 'disabled'} />
                        ))}
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </GridItem>
          </GridItem>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Appointment Report */}
          <Typography variant="h6" sx={{ mb: 3 }}>📅 รายงานการจองและตารางนัด</Typography>
          
          <GridItem container spacing={3}>
            <GridItem item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Event color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold" color="primary">298</Typography>
                  <Typography variant="body2">การจองเดือนนี้</Typography>
                </CardContent>
              </Card>
            </GridItem>
            <GridItem item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <PersonAdd color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold" color="success.main">92%</Typography>
                  <Typography variant="body2">อัตราการมา</Typography>
                </CardContent>
              </Card>
            </GridItem>
            <GridItem item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <DateRange color="warning" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold" color="warning.main">24</Typography>
                  <Typography variant="body2">ยกเลิก/เลื่อน</Typography>
                </CardContent>
              </Card>
            </GridItem>
          </GridItem>

          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>📊 การจองตามช่วงเวลา</Typography>
              <Box sx={{ height: 250, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                <Typography color="text.secondary">📊 กราฟการจองตามเวลา</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>🕒 ช่วงเวลาที่มีการจองมากที่สุด</Typography>
              <GridItem container spacing={2}>
                {[
                  { time: '09:00-11:00', bookings: 45, percentage: 85 },
                  { time: '11:00-13:00', bookings: 38, percentage: 72 },
                  { time: '13:00-15:00', bookings: 25, percentage: 47 },
                  { time: '15:00-17:00', bookings: 42, percentage: 79 },
                  { time: '17:00-19:00', bookings: 35, percentage: 66 },
                ].map((slot, index) => (
                  <GridItem item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{slot.time}</Typography>
                      <Typography variant="body2">{slot.bookings} การจอง</Typography>
                      <LinearProgress variant="determinate" value={slot.percentage} sx={{ mt: 1 }} />
                    </Box>
                  </GridItem>
                ))}
              </GridItem>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Inventory Report */}
          <Typography variant="h6" sx={{ mb: 3 }}>📦 รายงานสินค้าคงคลังและแจ้งเตือน</Typography>
          
          <GridItem container spacing={3}>
            <GridItem item xs={12} md={8}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>🚨 สินค้าที่ต้องสั่งเพิ่ม</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>รายการ</TableCell>
                          <TableCell align="right">คงเหลือ</TableCell>
                          <TableCell align="right">จุดสั่งซื้อ</TableCell>
                          <TableCell>สถานะ</TableCell>
                          <TableCell>การดำเนินการ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventoryAlerts.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.item}</TableCell>
                            <TableCell align="right">{item.stock}</TableCell>
                            <TableCell align="right">{item.reorder}</TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  item.status === 'critical' ? 'วิกฤต' :
                                  item.status === 'low' ? 'ต่ำ' : 'ปกติ'
                                }
                                color={
                                  item.status === 'critical' ? 'error' :
                                  item.status === 'low' ? 'warning' : 'success'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined">
                                สั่งซื้อ
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </GridItem>
            <GridItem item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>📊 สรุปสินค้าคงคลัง</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">มูลค่ารวม</Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        ฿2,450,000
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">รายการทั้งหมด</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        1,247 รายการ
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">สินค้าหมด</Typography>
                      <Typography variant="h5" fontWeight="bold" color="error">
                        3 รายการ
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">ใกล้หมดอายุ</Typography>
                      <Typography variant="h5" fontWeight="bold" color="warning.main">
                        15 รายการ
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </GridItem>
          </GridItem>
        </TabPanel>
      </Card>

      {/* Quick Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>⚡ การดำเนินการด่วน</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" startIcon={<Download />} sx={{ flex: 1 }}>
              ส่งออกรายงานยอดขาย
            </Button>
            <Button variant="outlined" startIcon={<Print />} sx={{ flex: 1 }}>
              พิมพ์รายงานลูกค้า
            </Button>
            <Button variant="outlined" startIcon={<Assessment />} sx={{ flex: 1 }}>
              วิเคราะห์แนวโน้ม
            </Button>
            <Button variant="outlined" startIcon={<DateRange />} sx={{ flex: 1 }}>
              กำหนดรายงานอัตโนมัติ
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;
