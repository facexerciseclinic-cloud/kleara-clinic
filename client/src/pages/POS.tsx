// React Core
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

// Components
import GridItem from '../components/common/GridItem';

// Material-UI Components
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  TextField,
  Divider,
  Chip,
  IconButton,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
  Autocomplete,
} from '@mui/material';

// Material-UI Icons
import {
  Add,
  Remove,
  ShoppingCart,
  Payment,
  Search,
  LocalHospital,
  Spa,
  ShoppingBag,
  Delete,
  Print,
  CreditCard,
  Money,
  Discount,
  Receipt,
  Person,
  ExpandMore,
  Calculate,
  History,
  QrCode,
  Loyalty,
  Percent,
  AttachMoney,
  AccountBalance,
  Close,
  Check,
  Star,
  LocalOffer,
  CameraAlt,
  Settings,
  Analytics,
} from '@mui/icons-material';

// TypeScript Interfaces
interface ServiceItem {
  id: number;
  name: string;
  price: number;
  category: 'treatment' | 'product' | 'consultation';
  description: string;
  commission: number;
  stock?: number | null;
  barcode: string;
  duration?: number | null;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  commission: number;
  stock?: number | null;
  discount?: number;
}

interface Customer {
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  totalSpending: number;
  tier: string;
}

interface DiscountType {
  id: string;
  name: string;
  type: 'percentage' | 'amount';
  value: number;
  minAmount?: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactElement;
  fee?: number;
}

interface LoyaltyTier {
  name: string;
  minSpending: number;
  discount: number;
  points: number;
}

// Discount and promotion data
const discountTypes: DiscountType[] = [
  { id: 'regular', name: 'ลูกค้าประจำ', type: 'percentage', value: 10, minAmount: 0 },
  { id: 'vip', name: 'สมาชิก VIP', type: 'percentage', value: 15, minAmount: 5000 },
  { id: 'bulk', name: 'ซื้อครบ 10,000', type: 'amount', value: 1000, minAmount: 10000 },
  { id: 'special', name: 'โปรโมชั่นพิเศษ', type: 'percentage', value: 20, minAmount: 0 },
];

// Payment methods
const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: 'เงินสด', icon: <Money />, fee: 0 },
  { id: 'credit', name: 'บัตรเครดิต', icon: <CreditCard />, fee: 2.5 },
  { id: 'debit', name: 'บัตรเดบิต', icon: <AccountBalance />, fee: 1.5 },
  { id: 'qr', name: 'QR Code', icon: <QrCode />, fee: 1.0 },
  { id: 'transfer', name: 'โอนเงิน', icon: <AttachMoney />, fee: 0 },
];

// Customer loyalty program
const loyaltyTiers: LoyaltyTier[] = [
  { name: 'Bronze', minSpending: 0, discount: 0, points: 1 },
  { name: 'Silver', minSpending: 10000, discount: 5, points: 1.5 },
  { name: 'Gold', minSpending: 25000, discount: 10, points: 2 },
  { name: 'Platinum', minSpending: 50000, discount: 15, points: 3 },
];

// Main POS Component
const POS: React.FC = () => {
  // State for services/products
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for patients
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: '',
    email: '',
    loyaltyPoints: 0,
    totalSpending: 0,
    tier: 'Bronze'
  });
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'payment' | 'discount' | 'receipt' | 'customer' | 'history'>('payment');
  
  // Discount and payment states
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  
  // UI states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  // Fetch services/products from API
  useEffect(() => {
    fetchServices();
    fetchPatients();
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
      setLoading(true);
      const response = await api.get('/services');
      console.log('Services API response:', response.data);
      
      if (response.data.success) {
        const servicesData = response.data.data || [];
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      showSnackbar('ไม่สามารถโหลดรายการสินค้าและบริการได้');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string): void => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setCustomer({
      name: `${patient.profile?.firstName || ''} ${patient.profile?.lastName || ''}`.trim(),
      phone: patient.profile?.contact?.phone || patient.contact?.phone || '',
      email: patient.profile?.contact?.email || patient.contact?.email || '',
      loyaltyPoints: patient.loyaltyPoints || 0,
      totalSpending: patient.financials?.totalSpending || 0,
      tier: patient.membershipInfo?.level || 'Bronze'
    });
    showSnackbar(`เลือกผู้ป่วย: ${patient.profile?.firstName} ${patient.profile?.lastName}`);
  };

  const openDialog = (type: 'payment' | 'discount' | 'receipt' | 'customer' | 'history'): void => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const closeDialog = (): void => {
    setDialogOpen(false);
    setReceivedAmount(0);
    setSelectedDiscount(null);
    setCustomDiscount(0);
    setLoyaltyPointsUsed(0);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (service: ServiceItem): void => {
    // Check stock for products
    if (service.category === 'product' && service.stock !== null && service.stock !== undefined) {
      const currentQuantity = cart.find(item => item.id === service.id)?.quantity || 0;
      if (currentQuantity >= service.stock) {
        showSnackbar('สินค้าไม่เพียงพอในสต็อก');
        return;
      }
    }

    const existingItem = cart.find(item => item.id === service.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        ...service, 
        quantity: 1,
        discount: 0
      }]);
    }
    showSnackbar(`เพิ่ม ${service.name} ลงในตะกร้าแล้ว`);
  };

  const updateQuantity = (id: number, change: number) => {
    const service = services.find(s => s.id === id);
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        
        // Check stock limit
        if (service?.category === 'product' && service.stock !== null && service.stock !== undefined && newQuantity > service.stock) {
          showSnackbar('ไม่สามารถเพิ่มได้ เกินจำนวนสต็อก');
          return item;
        }
        
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: number): void => {
    setCart(cart.filter(item => item.id !== id));
    showSnackbar('ลบรายการออกจากตะกร้าแล้ว');
  };

  const getSubtotal = (): number => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = (): number => {
    const subtotal = getSubtotal();
    let discountAmount = 0;
    
    if (selectedDiscount) {
      if (selectedDiscount.type === 'percentage') {
        discountAmount = subtotal * (selectedDiscount.value / 100);
      } else {
        discountAmount = selectedDiscount.value;
      }
    }
    
    if (customDiscount > 0) {
      discountAmount += subtotal * (customDiscount / 100);
    }
    
    // Loyalty points discount (1 point = 1 baht)
    discountAmount += loyaltyPointsUsed;
    
    return Math.min(discountAmount, subtotal);
  };

  const getPaymentFee = (): number => {
    const method = paymentMethods.find(m => m.id === paymentMethod);
    const subtotal = getSubtotal() - getDiscountAmount();
    return method && method.fee ? (subtotal * method.fee / 100) : 0;
  };

  const getTotalAmount = (): number => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const fee = getPaymentFee();
    return subtotal - discount + fee;
  };

  const getCommissionTotal = (): number => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      return total + (itemTotal * item.commission / 100);
    }, 0);
  };

  const getItemCount = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = (): void => {
    setCart([]);
    setCustomer({
      name: '',
      phone: '',
      email: '',
      loyaltyPoints: 0,
      totalSpending: 0,
      tier: 'Bronze'
    });
    setSelectedDiscount(null);
    setCustomDiscount(0);
    setLoyaltyPointsUsed(0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showSnackbar('กรุณาเพิ่มสินค้าหรือบริการลงในตะกร้า');
      return;
    }
    openDialog('payment');
  };

  const confirmPayment = () => {
    const total = getTotalAmount();
    const method = paymentMethods.find(m => m.id === paymentMethod);
    
    if (paymentMethod === 'cash' && receivedAmount < total) {
      showSnackbar('จำนวนเงินที่รับไม่เพียงพอ');
      return;
    }

    // Add to sales history
    const newSale = {
      id: Date.now(),
      timestamp: new Date(),
      items: [...cart],
      customer: { ...customer },
      subtotal: getSubtotal(),
      discount: getDiscountAmount(),
      fee: getPaymentFee(),
      total: total,
      paymentMethod: method?.name,
      receivedAmount: receivedAmount,
      change: paymentMethod === 'cash' ? receivedAmount - total : 0,
      commission: getCommissionTotal(),
    };
    
    setSalesHistory([newSale, ...salesHistory]);
    
    // Update customer loyalty points
    const pointsEarned = Math.floor(total / 100); // 1 point per 100 baht
    const updatedCustomer = {
      ...customer,
      loyaltyPoints: customer.loyaltyPoints + pointsEarned - loyaltyPointsUsed,
      totalSpending: customer.totalSpending + total
    };
    setCustomer(updatedCustomer);
    
    showSnackbar('ชำระเงินสำเร็จ!');
    openDialog('receipt');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'treatment':
        return <LocalHospital />;
      case 'product':
        return <ShoppingBag />;
      default:
        return <Spa />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'treatment':
        return 'primary';
      case 'product':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          💳 ระบบขายหน้าร้าน (POS)
        </Typography>
        <Badge badgeContent={getItemCount()} color="error">
          <ShoppingCart sx={{ fontSize: 30 }} />
        </Badge>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, height: 'calc(100vh - 200px)' }}>
        {/* Left Panel - Services/Products */}
        <Box>
          {/* Enhanced Search and Filters */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  placeholder="ค้นหาบริการหรือสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant={categoryFilter === 'all' ? 'contained' : 'outlined'}
                    onClick={() => setCategoryFilter('all')}
                  >
                    ทั้งหมด
                  </Button>
                  <Button
                    size="small"
                    variant={categoryFilter === 'treatment' ? 'contained' : 'outlined'}
                    onClick={() => setCategoryFilter('treatment')}
                    startIcon={<LocalHospital />}
                  >
                    บริการ
                  </Button>
                  <Button
                    size="small"
                    variant={categoryFilter === 'product' ? 'contained' : 'outlined'}
                    onClick={() => setCategoryFilter('product')}
                    startIcon={<ShoppingBag />}
                  >
                    สินค้า
                  </Button>
                  <Button
                    size="small"
                    variant={categoryFilter === 'consultation' ? 'contained' : 'outlined'}
                    onClick={() => setCategoryFilter('consultation')}
                    startIcon={<Spa />}
                  >
                    ปรึกษา
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Enhanced Services Grid */}
          <Card sx={{ height: 'calc(100% - 140px)', overflow: 'auto' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🛍️ บริการและสินค้า ({filteredServices.length} รายการ)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                {filteredServices.map((service) => (
                  <Card
                    key={service.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4 },
                      transition: 'box-shadow 0.3s',
                      border: service.category === 'product' && service.stock !== null && service.stock !== undefined && service.stock < 10 
                        ? '2px solid orange' : 'none'
                    }}
                    onClick={() => addToCart(service)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: `${getCategoryColor(service.category)}.light`, mr: 2 }}>
                          {getCategoryIcon(service.category)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {service.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={service.category === 'treatment' ? 'บริการ' : 
                                     service.category === 'product' ? 'สินค้า' : 'ปรึกษา'}
                              size="small"
                              color={getCategoryColor(service.category)}
                            />
                            {service.commission > 0 && (
                              <Chip
                                label={`คอม ${service.commission}%`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {service.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          ฿{service.price.toLocaleString()}
                        </Typography>
                        {service.category === 'product' && service.stock !== null && service.stock !== undefined && (
                          <Typography 
                            variant="caption" 
                            color={service.stock < 10 ? 'error' : 'text.secondary'}
                          >
                            สต็อก: {service.stock}
                          </Typography>
                        )}
                        {service.duration && (
                          <Typography variant="caption" color="text.secondary">
                            {service.duration} นาที
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Right Panel - Cart & Checkout */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Enhanced Customer Info */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">👤 ข้อมูลลูกค้า</Typography>
                <Button 
                  size="small" 
                  onClick={() => openDialog('customer')}
                  startIcon={<Person />}
                >
                  จัดการ
                </Button>
              </Box>
              <Stack spacing={2}>
                <Autocomplete
                  options={patients}
                  getOptionLabel={(option) => `${option.profile?.firstName || ''} ${option.profile?.lastName || ''} (HN: ${option.hn})`.trim()}
                  value={selectedPatient}
                  onChange={(_event, newValue) => {
                    if (newValue) {
                      handleSelectPatient(newValue);
                    } else {
                      setSelectedPatient(null);
                      setCustomer({
                        name: '',
                        phone: '',
                        email: '',
                        loyaltyPoints: 0,
                        totalSpending: 0,
                        tier: 'Bronze'
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="เลือกผู้ป่วย" 
                      placeholder="ค้นหาด้วยชื่อหรือ HN"
                      size="small"
                    />
                  )}
                  loading={patients.length === 0}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                />
                
                <TextField
                  fullWidth
                  label="ชื่อลูกค้า"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  size="small"
                  disabled={!!selectedPatient}
                />
                <TextField
                  fullWidth
                  label="เบอร์โทรศัพท์"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  size="small"
                  disabled={!!selectedPatient}
                />
                {customer.loyaltyPoints > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Loyalty color="primary" />
                    <Typography variant="body2">
                      คะแนน: {customer.loyaltyPoints} แต้ม | {customer.tier}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🛒 ตะกร้าสินค้า ({getItemCount()} รายการ)
              </Typography>
              
              {cart.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <ShoppingCart sx={{ fontSize: 60, mb: 2 }} />
                  <Typography>ยังไม่มีสินค้าในตะกร้า</Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <List>
                    {cart.map((item) => (
                      <ListItem key={item.id} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${getCategoryColor(item.category)}.light` }}>
                            {getCategoryIcon(item.category)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.name}
                          secondary={`฿${item.price.toLocaleString()} × ${item.quantity}`}
                        />
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, -1)}
                            color="primary"
                          >
                            <Remove />
                          </IconButton>
                          <Typography variant="body1" sx={{ minWidth: 20, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, 1)}
                            color="primary"
                          >
                            <Add />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => removeFromCart(item.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {cart.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Enhanced Order Summary */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">ยอดรวม:</Typography>
                      <Typography variant="body2">฿{getSubtotal().toLocaleString()}</Typography>
                    </Box>
                    
                    {getDiscountAmount() > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="success.main">ส่วนลด:</Typography>
                        <Typography variant="body2" color="success.main">
                          -฿{getDiscountAmount().toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    
                    {getPaymentFee() > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="warning.main">ค่าธรรมเนียม:</Typography>
                        <Typography variant="body2" color="warning.main">
                          +฿{getPaymentFee().toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">ยอดสุทธิ:</Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        ฿{getTotalAmount().toLocaleString()}
                      </Typography>
                    </Box>

                    {getCommissionTotal() > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        คอมมิชชั่น: ฿{getCommissionTotal().toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  {/* Discount and Quick Actions */}
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => openDialog('discount')}
                      startIcon={<Discount />}
                      sx={{ flex: 1 }}
                    >
                      ส่วนลด
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => openDialog('history')}
                      startIcon={<History />}
                    >
                      ประวัติ
                    </Button>
                  </Stack>

                  {/* Action Buttons */}
                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleCheckout}
                      startIcon={<Payment />}
                      fullWidth
                    >
                      ชำระเงิน ฿{getTotalAmount().toLocaleString()}
                    </Button>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        onClick={clearCart}
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        ล้างตะกร้า
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Receipt />}
                        onClick={() => openDialog('receipt')}
                        size="small"
                        sx={{ flex: 1 }}
                        disabled={salesHistory.length === 0}
                      >
                        ใบเสร็จ
                      </Button>
                    </Stack>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Comprehensive Dialogs */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'payment' && '💳 ชำระเงิน'}
          {dialogType === 'discount' && '🏷️ จัดการส่วนลด'}
          {dialogType === 'receipt' && '📄 ใบเสร็จ'}
          {dialogType === 'customer' && '👤 ข้อมูลลูกค้า'}
          {dialogType === 'history' && '📊 ประวัติการขาย'}
        </DialogTitle>
        <DialogContent>
          {/* Payment Dialog */}
          {dialogType === 'payment' && (
            <Box sx={{ pt: 2 }}>
              <GridItem container spacing={3}>
                <GridItem item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>วิธีการชำระเงิน</Typography>
                  <Stack spacing={2}>
                    {paymentMethods.map((method) => (
                      <Button
                        key={method.id}
                        variant={paymentMethod === method.id ? 'contained' : 'outlined'}
                        onClick={() => setPaymentMethod(method.id)}
                        startIcon={method.icon}
                        fullWidth
                        sx={{ justifyContent: 'flex-start', p: 2 }}
                      >
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body1">{method.name}</Typography>
                          {method.fee && method.fee > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              ค่าธรรมเนียม {method.fee}%
                            </Typography>
                          )}
                        </Box>
                      </Button>
                    ))}
                  </Stack>
                </GridItem>
                <GridItem item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>สรุปการชำระเงิน</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>ยอดรวม:</Typography>
                      <Typography>฿{getSubtotal().toLocaleString()}</Typography>
                    </Box>
                    {getDiscountAmount() > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="success.main">ส่วนลด:</Typography>
                        <Typography color="success.main">-฿{getDiscountAmount().toLocaleString()}</Typography>
                      </Box>
                    )}
                    {getPaymentFee() > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="warning.main">ค่าธรรมเนียม:</Typography>
                        <Typography color="warning.main">+฿{getPaymentFee().toLocaleString()}</Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <Typography variant="h6">ยอดสุทธิ:</Typography>
                      <Typography variant="h6" color="primary">฿{getTotalAmount().toLocaleString()}</Typography>
                    </Box>
                  </Paper>
                  
                  {paymentMethod === 'cash' && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="จำนวนเงินที่รับ"
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(Number(e.target.value))}
                        sx={{ mb: 1 }}
                      />
                      {receivedAmount > 0 && (
                        <Typography variant="body2" color={receivedAmount >= getTotalAmount() ? 'success.main' : 'error.main'}>
                          เงินทอน: ฿{Math.max(0, receivedAmount - getTotalAmount()).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </GridItem>
              </GridItem>
            </Box>
          )}

          {/* Discount Dialog */}
          {dialogType === 'discount' && (
            <Box sx={{ pt: 2 }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="ส่วนลดมาตรฐาน" />
                <Tab label="ส่วนลดกำหนดเอง" />
                <Tab label="แต้มสะสม" />
              </Tabs>
              
              {tabValue === 0 && (
                <Box sx={{ pt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>เลือกส่วนลด</Typography>
                  {discountTypes.map((discount) => (
                    <Card 
                      key={discount.id} 
                      sx={{ 
                        mb: 2, 
                        cursor: 'pointer',
                        border: selectedDiscount?.id === discount.id ? '2px solid' : '1px solid',
                        borderColor: selectedDiscount?.id === discount.id ? 'primary.main' : 'divider'
                      }}
                      onClick={() => setSelectedDiscount(selectedDiscount?.id === discount.id ? null : discount)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">{discount.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              ยอดขั้นต่ำ: ฿{discount.minAmount?.toLocaleString() || '0'}
                            </Typography>
                          </Box>
                          <Chip
                            label={discount.type === 'percentage' ? `${discount.value}%` : `฿${discount.value}`}
                            color="primary"
                            variant={selectedDiscount?.id === discount.id ? 'filled' : 'outlined'}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box sx={{ pt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>ส่วนลดกำหนดเอง</Typography>
                  <TextField
                    fullWidth
                    label="เปอร์เซ็นต์ส่วนลด"
                    type="number"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                    InputProps={{
                      endAdornment: '%'
                    }}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    ส่วนลด: ฿{((getSubtotal() * customDiscount) / 100).toLocaleString()}
                  </Typography>
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box sx={{ pt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>ใช้แต้มสะสม</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    แต้มที่มี: {customer.loyaltyPoints} แต้ม (1 แต้ม = 1 บาท)
                  </Typography>
                  <TextField
                    fullWidth
                    label="จำนวนแต้มที่ใช้"
                    type="number"
                    value={loyaltyPointsUsed}
                    onChange={(e) => setLoyaltyPointsUsed(Math.min(customer.loyaltyPoints, Math.max(0, Number(e.target.value))))}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    ส่วนลด: ฿{loyaltyPointsUsed.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Receipt Dialog */}
          {dialogType === 'receipt' && salesHistory.length > 0 && (
            <Box sx={{ pt: 2 }}>
              <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto', fontFamily: 'monospace' }}>
                <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                  KLEARA CLINIC
                </Typography>
                <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                  ใบเสร็จ #{salesHistory[0].id}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  วันที่: {salesHistory[0].timestamp.toLocaleDateString('th-TH')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  เวลา: {salesHistory[0].timestamp.toLocaleTimeString('th-TH')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  ลูกค้า: {salesHistory[0].customer.name || 'ไม่ระบุ'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {salesHistory[0].items.map((item: any, index: number) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">{item.name}</Typography>
                    <Typography variant="body2">
                      ฿{item.price.toLocaleString()} × {item.quantity} = ฿{(item.price * item.quantity).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">ยอดรวม:</Typography>
                  <Typography variant="body2">฿{salesHistory[0].subtotal.toLocaleString()}</Typography>
                </Box>
                
                {salesHistory[0].discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">ส่วนลด:</Typography>
                    <Typography variant="body2">-฿{salesHistory[0].discount.toLocaleString()}</Typography>
                  </Box>
                )}
                
                {salesHistory[0].fee > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">ค่าธรรมเนียม:</Typography>
                    <Typography variant="body2">+฿{salesHistory[0].fee.toLocaleString()}</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', mt: 2 }}>
                  <Typography variant="body1">ยอดสุทธิ:</Typography>
                  <Typography variant="body1">฿{salesHistory[0].total.toLocaleString()}</Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mt: 2 }}>
                  ชำระด้วย: {salesHistory[0].paymentMethod}
                </Typography>
                
                {salesHistory[0].receivedAmount > 0 && (
                  <>
                    <Typography variant="body2">
                      รับเงิน: ฿{salesHistory[0].receivedAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      เงินทอน: ฿{salesHistory[0].change.toLocaleString()}
                    </Typography>
                  </>
                )}
                
                <Typography variant="caption" align="center" sx={{ mt: 3, display: 'block' }}>
                  ขอบคุณที่ใช้บริการ
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Customer Management Dialog */}
          {dialogType === 'customer' && (
            <Box sx={{ pt: 2 }}>
              <GridItem container spacing={3}>
                <GridItem item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>ข้อมูลลูกค้า</Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="ชื่อลูกค้า"
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    />
                    <TextField
                      fullWidth
                      label="เบอร์โทรศัพท์"
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                    />
                    <TextField
                      fullWidth
                      label="อีเมล"
                      value={customer.email}
                      onChange={(e) => setCustomer({...customer, email: e.target.value})}
                    />
                  </Stack>
                </GridItem>
                <GridItem item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>โปรแกรมสมาชิก</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ระดับปัจจุบัน: <strong>{customer.tier}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      แต้มสะสม: <strong>{customer.loyaltyPoints} แต้ม</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      ยอดซื้อสะสม: <strong>฿{customer.totalSpending.toLocaleString()}</strong>
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>ระดับสมาชิก</Typography>
                  {loyaltyTiers.map((tier) => (
                    <Box key={tier.name} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      p: 1, 
                      mb: 1,
                      bgcolor: customer.tier === tier.name ? 'primary.light' : 'grey.100',
                      borderRadius: 1 
                    }}>
                      <Typography variant="body2">{tier.name}</Typography>
                      <Typography variant="body2">
                        ฿{tier.minSpending.toLocaleString()}+ ({tier.discount}% ส่วนลด)
                      </Typography>
                    </Box>
                  ))}
                </GridItem>
              </GridItem>
            </Box>
          )}

          {/* Sales History Dialog */}
          {dialogType === 'history' && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>ประวัติการขาย (วันนี้)</Typography>
              {salesHistory.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  ยังไม่มีประวัติการขาย
                </Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>เวลา</TableCell>
                      <TableCell>ลูกค้า</TableCell>
                      <TableCell>รายการ</TableCell>
                      <TableCell align="right">ยอดรวม</TableCell>
                      <TableCell>วิธีชำระ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesHistory.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.timestamp.toLocaleTimeString('th-TH')}</TableCell>
                        <TableCell>{sale.customer.name || 'ไม่ระบุ'}</TableCell>
                        <TableCell>{sale.items.length} รายการ</TableCell>
                        <TableCell align="right">฿{sale.total.toLocaleString()}</TableCell>
                        <TableCell>{sale.paymentMethod}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ปิด</Button>
          {dialogType === 'payment' && (
            <Button 
              variant="contained" 
              onClick={confirmPayment}
              disabled={paymentMethod === 'cash' && receivedAmount < getTotalAmount()}
            >
              ยืนยันการชำระเงิน
            </Button>
          )}
          {dialogType === 'receipt' && salesHistory.length > 0 && (
            <Button 
              variant="contained" 
              startIcon={<Print />}
              onClick={() => {
                showSnackbar('พิมพ์ใบเสร็จสำเร็จ');
                clearCart();
                closeDialog();
              }}
            >
              พิมพ์ใบเสร็จ
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

    </Box>
  );
};

export default POS;
