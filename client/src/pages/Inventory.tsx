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
  Alert,
  Container,
  Paper,
} from '@mui/material';
import {
  Add,
  Search,
  Warning,
  TrendingUp,
  TrendingDown,
  Edit,
  Visibility,
  ShoppingCart,
  LocalShipping,
  Inventory2,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';
import { LoadingState } from '../components/common/States';

// Sample inventory data
const sampleProducts = [
  {
    id: 1,
    name: 'Botox 100 Units',
    category: 'Medical',
    sku: 'BTX100',
    currentStock: 5,
    minStock: 10,
    maxStock: 50,
    price: 12000,
    cost: 8000,
    supplier: 'Allergan',
    location: 'Freezer A1',
    expiryDate: '2025-06-15',
    status: 'low-stock',
    lastUpdated: '2024-10-07',
  },
  {
    id: 2,
    name: 'Hyaluronic Acid Filler',
    category: 'Medical',
    sku: 'HAF001',
    currentStock: 25,
    minStock: 15,
    maxStock: 100,
    price: 15000,
    cost: 10000,
    supplier: 'Juvederm',
    location: 'Refrigerator B2',
    expiryDate: '2025-12-20',
    status: 'in-stock',
    lastUpdated: '2024-10-08',
  },
  {
    id: 3,
    name: 'Vitamin C Serum',
    category: 'Skincare',
    sku: 'VCS50',
    currentStock: 80,
    minStock: 20,
    maxStock: 200,
    price: 2800,
    cost: 1400,
    supplier: 'SkinCeuticals',
    location: 'Shelf C3',
    expiryDate: '2026-03-10',
    status: 'in-stock',
    lastUpdated: '2024-10-08',
  },
  {
    id: 4,
    name: 'Sunscreen SPF 50',
    category: 'Skincare',
    sku: 'SUN50',
    currentStock: 2,
    minStock: 30,
    maxStock: 150,
    price: 1200,
    cost: 600,
    supplier: 'La Roche-Posay',
    location: 'Shelf D1',
    expiryDate: '2025-08-30',
    status: 'critical',
    lastUpdated: '2024-10-06',
  },
];

const Inventory: React.FC = () => {
  const { showNotification } = useNotifications();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'add' | 'edit' | 'stock-in' | 'stock-out'>('view');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [stockQuantity, setStockQuantity] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory/products');
      
      // Transform backend data
      const transformedProducts = response.data.data.map((p: any) => ({
        id: p._id,
        name: p.name,
        category: p.category,
        sku: p.sku,
        currentStock: p.quantity?.onHand || 0,
        minStock: p.quantity?.reorderPoint || 10,
        maxStock: p.quantity?.maxStock || 100,
        price: p.pricing?.retailPrice || 0,
        cost: p.pricing?.costPrice || 0,
        supplier: p.supplier?.name || '-',
        location: p.storage?.location || '-',
        expiryDate: p.lots?.[0]?.expiryDate?.split('T')[0] || '-',
        status: getStockStatus(p.quantity?.onHand, p.quantity?.reorderPoint),
        lastUpdated: p.updatedAt?.split('T')[0] || '-',
      }));
      
      setProducts(transformedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) return 'out-of-stock';
    if (currentStock <= minStock * 0.5) return 'critical';
    if (currentStock <= minStock) return 'low-stock';
    return 'in-stock';
  };

  const openAddDialog = () => {
    setDialogType('add');
    setFormData({});
    setOpenDialog(true);
  };

  const openEditDialog = (product: any) => {
    setDialogType('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      cost: product.cost,
      minStock: product.minStock,
      location: product.location,
    });
    setOpenDialog(true);
  };

  const openStockDialog = (type: 'stock-in' | 'stock-out', product: any) => {
    setDialogType(type);
    setSelectedProduct(product);
    setStockQuantity(0);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setFormData({});
    setStockQuantity(0);
  };

  const handleAddProduct = async () => {
    try {
      const productData = {
        name: formData.name,
        sku: formData.sku || `SKU${Date.now()}`,
        category: formData.category || 'Product',
        pricing: {
          retailPrice: Number(formData.price) || 0,
          costPrice: Number(formData.cost) || 0,
        },
        quantity: {
          onHand: 0,
          reorderPoint: Number(formData.minStock) || 10,
          maxStock: 100,
        },
        storage: {
          location: formData.location || 'Main Storage',
        },
      };

      const response = await api.post('/inventory/products', productData);
      
      if (response.data.success) {
        showNotification('เพิ่มสินค้าสำเร็จ', 'success');
        fetchProducts();
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถเพิ่มสินค้าได้', 'error');
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        pricing: {
          retailPrice: Number(formData.price),
          costPrice: Number(formData.cost),
        },
        quantity: {
          reorderPoint: Number(formData.minStock),
        },
        storage: {
          location: formData.location,
        },
      };

      const response = await api.put(`/api/inventory/products/${selectedProduct.id}`, productData);
      
      if (response.data.success) {
        showNotification('อัปเดตสินค้าสำเร็จ', 'success');
        fetchProducts();
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถอัปเดตสินค้าได้', 'error');
    }
  };

  const handleStockMovement = async () => {
    if (!selectedProduct || stockQuantity <= 0) {
      showNotification('กรุณาระบุจำนวนสินค้า', 'warning');
      return;
    }

    try {
      const movementData = {
        productId: selectedProduct.id,
        quantity: dialogType === 'stock-out' ? -stockQuantity : stockQuantity,
        type: dialogType === 'stock-in' ? 'receive' : 'issue',
        notes: dialogType === 'stock-in' ? 'รับสินค้าเข้า' : 'เบิกสินค้าออก',
      };

      const response = await api.post('/inventory/movements', movementData);
      
      if (response.data.success) {
        showNotification(
          dialogType === 'stock-in' ? 'รับสินค้าเข้าสำเร็จ' : 'เบิกสินค้าสำเร็จ',
          'success'
        );
        fetchProducts();
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error stock movement:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถจัดการ stock ได้', 'error');
    }
  };

  const fetchReportData = async () => {
    setLoadingReport(true);
    try {
      const response = await api.get('/inventory/reports');
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      showNotification('ไม่สามารถดึงข้อมูลรายงานได้', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCreatePurchaseOrder = async (selectedItems: any[]) => {
    try {
      const items = selectedItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }));

      const response = await api.post('/inventory/purchase-orders', {
        items,
        notes: 'Auto-generated purchase order',
        supplier: 'TBD'
      });

      if (response.data.success) {
        showNotification('สร้างใบสั่งซื้อสำเร็จ', 'success');
        setPurchaseDialogOpen(false);
        fetchProducts();
      }
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      showNotification(error.response?.data?.message || 'ไม่สามารถสร้างใบสั่งซื้อได้', 'error');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'success';
      case 'low-stock': return 'warning';
      case 'critical': return 'error';
      case 'out-of-stock': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-stock': return 'พอใช้';
      case 'low-stock': return 'ใกล้หมด';
      case 'critical': return 'วิกฤต';
      case 'out-of-stock': return 'หมดสต็อก';
      default: return status;
    }
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.status === 'low-stock' || p.status === 'critical').length;
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.cost), 0);

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลสินค้า..." fullPage />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Inventory2 sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
              จัดการสินค้าคงคลัง
            </Typography>
            <Typography variant="body2" color="text.secondary">
              จัดการและติดตามสินค้าในคลินิก
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAddDialog}
        >
          เพิ่มสินค้า
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{totalProducts}</Typography>
            <Typography variant="body2">รายการสินค้า</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{lowStockProducts}</Typography>
            <Typography variant="body2">สินค้าใกล้หมด</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">฿{totalValue.toLocaleString()}</Typography>
            <Typography variant="body2">มูลค่าสต็อก</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">3</Typography>
            <Typography variant="body2">หมวดหมู่</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Alerts */}
      {lowStockProducts > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1">
            ⚠️ มีสินค้า {lowStockProducts} รายการที่ใกล้หมดหรือหมดแล้ว กรุณาสั่งซื้อเพิ่ม
          </Typography>
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="ค้นหาสินค้า (ชื่อ, SKU)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl>
              <InputLabel>หมวดหมู่</InputLabel>
              <Select
                value={categoryFilter}
                label="หมวดหมู่"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="Medical">เวชภัณฑ์</MenuItem>
                <MenuItem value="Skincare">ผลิตภัณฑ์ผิว</MenuItem>
                <MenuItem value="Equipment">อุปกรณ์</MenuItem>
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
                <MenuItem value="in-stock">พอใช้</MenuItem>
                <MenuItem value="low-stock">ใกล้หมด</MenuItem>
                <MenuItem value="critical">วิกฤต</MenuItem>
                <MenuItem value="out-of-stock">หมดสต็อก</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="outlined" 
              onClick={() => {
                setReportDialogOpen(true);
                fetchReportData();
              }}
              startIcon={<TrendingUp />}
            >
              รายงาน
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📋 รายการสินค้าคงคลัง
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>สินค้า</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>หมวดหมู่</TableCell>
                  <TableCell>จำนวน</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>ราคา</TableCell>
                  <TableCell>ตำแหน่ง</TableCell>
                  <TableCell>วันหมดอายุ</TableCell>
                  <TableCell>การดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                          <InventoryIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.supplier}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      <Chip 
                        label={product.category} 
                        size="small" 
                        color={product.category === 'Medical' ? 'primary' : 
                               product.category === 'Skincare' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {product.currentStock}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ต่ำสุด: {product.minStock}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(product.status)}
                        size="small"
                        color={getStatusColor(product.status)}
                        icon={product.status === 'critical' || product.status === 'low-stock' ? 
                              <Warning /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ฿{product.price.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ต้นทุน: ฿{product.cost.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{product.location}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={new Date(product.expiryDate) < new Date() ? 'error' : 'inherit'}
                      >
                        {new Date(product.expiryDate).toLocaleDateString('th-TH')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDialogType('view');
                            setSelectedProduct(product);
                            setOpenDialog(true);
                          }}
                          color="info"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openStockDialog('stock-in', product)}
                          color="success"
                        >
                          <TrendingUp />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openStockDialog('stock-out', product)}
                          color="warning"
                        >
                          <TrendingDown />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(product)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
              startIcon={<Add />}
              onClick={openAddDialog}
              sx={{ flex: 1 }}
            >
              เพิ่มสินค้าใหม่
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShoppingCart />}
              onClick={() => setPurchaseDialogOpen(true)}
              sx={{ flex: 1 }}
            >
              สั่งซื้อสินค้า
            </Button>
            <Button
              variant="outlined"
              startIcon={<LocalShipping />}
              onClick={() => showNotification('เลือกสินค้าจากตารางแล้วกดปุ่มรับสินค้าเข้า', 'info')}
              sx={{ flex: 1 }}
            >
              รับสินค้าเข้า
            </Button>
            <Button
              variant="outlined"
              startIcon={<Warning />}
              onClick={() => showNotification(`มีสินค้าใกล้หมด ${lowStockProducts} รายการ`, 'warning')}
              sx={{ flex: 1 }}
            >
              ตรวจสอบแจ้งเตือน
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {/* View Dialog */}
      <Dialog open={openDialog && dialogType === 'view'} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>รายละเอียดสินค้า</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedProduct.name}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2">SKU:</Typography>
                  <Typography>{selectedProduct.sku}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">หมวดหมู่:</Typography>
                  <Typography>{selectedProduct.category}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">จำนวนปัจจุบัน:</Typography>
                  <Typography>{selectedProduct.currentStock}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">ราคาขาย:</Typography>
                  <Typography>฿{selectedProduct.price.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">ผู้จัดจำหน่าย:</Typography>
                  <Typography>{selectedProduct.supplier}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">ตำแหน่ง:</Typography>
                  <Typography>{selectedProduct.location}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ปิด</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog && (dialogType === 'add' || dialogType === 'edit')} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{dialogType === 'add' ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="ชื่อสินค้า *"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="จะสร้างอัตโนมัติถ้าไม่ระบุ"
              />
              <FormControl fullWidth>
                <InputLabel>หมวดหมู่</InputLabel>
                <Select
                  value={formData.category || 'Product'}
                  label="หมวดหมู่"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="Medical">เวชภัณฑ์</MenuItem>
                  <MenuItem value="Skincare">ผลิตภัณฑ์บำรุงผิว</MenuItem>
                  <MenuItem value="Product">สินค้าทั่วไป</MenuItem>
                  <MenuItem value="Equipment">อุปกรณ์</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="ราคาขาย (฿)"
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <TextField
                fullWidth
                label="ราคาทุน (฿)"
                type="number"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="จุด Reorder"
                type="number"
                value={formData.minStock || ''}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                helperText="แจ้งเตือนเมื่อสินค้าต่ำกว่าจำนวนนี้"
              />
              <TextField
                fullWidth
                label="ตำแหน่งจัดเก็บ"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="เช่น Shelf A1, Freezer B2"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            onClick={dialogType === 'add' ? handleAddProduct : handleUpdateProduct}
          >
            {dialogType === 'add' ? 'เพิ่มสินค้า' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock In/Out Dialog */}
      <Dialog open={openDialog && (dialogType === 'stock-in' || dialogType === 'stock-out')} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'stock-in' ? '� รับสินค้าเข้า' : '📤 เบิกสินค้าออก'}
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="bold">{selectedProduct.name}</Typography>
                <Typography variant="caption">
                  สต็อกปัจจุบัน: {selectedProduct.currentStock} หน่วย
                </Typography>
              </Alert>
              <TextField
                fullWidth
                label="จำนวน"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Math.max(0, Number(e.target.value)))}
                InputProps={{
                  inputProps: { min: 0 }
                }}
                helperText={
                  dialogType === 'stock-out' && stockQuantity > selectedProduct.currentStock
                    ? '⚠️ จำนวนมากกว่าสต็อกที่มี'
                    : ''
                }
                error={dialogType === 'stock-out' && stockQuantity > selectedProduct.currentStock}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            onClick={handleStockMovement}
            color={dialogType === 'stock-in' ? 'success' : 'warning'}
          >
            {dialogType === 'stock-in' ? 'รับสินค้า' : 'เบิกสินค้า'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Report Dialog */}
      <Dialog 
        open={reportDialogOpen} 
        onClose={() => setReportDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          📊 รายงานสินค้าคงคลัง
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {loadingReport ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>กำลังโหลดข้อมูล...</Typography>
              </Box>
            ) : reportData ? (
              <>
                {/* Summary Cards */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <Card sx={{ flex: 1, bgcolor: 'primary.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="primary.contrastText">มูลค่ารวม</Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.contrastText">
                        ฿{reportData.summary?.totalValue?.toLocaleString() || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ flex: 1, bgcolor: 'success.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="success.contrastText">จำนวนรายการ</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.contrastText">
                        {reportData.summary?.totalItems || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ flex: 1, bgcolor: 'warning.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="warning.contrastText">ใกล้หมด</Typography>
                      <Typography variant="h5" fontWeight="bold" color="warning.contrastText">
                        {reportData.summary?.lowStockItems || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ flex: 1, bgcolor: 'error.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="error.contrastText">หมดสต็อก</Typography>
                      <Typography variant="h5" fontWeight="bold" color="error.contrastText">
                        {reportData.summary?.outOfStockItems || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Stack>

                {/* Low Stock Items */}
                <Typography variant="h6" sx={{ mb: 2 }}>⚠️ สินค้าที่ต้องสั่งซื้อ</Typography>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>รหัสสินค้า</TableCell>
                        <TableCell>ชื่อสินค้า</TableCell>
                        <TableCell align="right">คงเหลือ</TableCell>
                        <TableCell align="right">ขั้นต่ำ</TableCell>
                        <TableCell align="right">ควรสั่ง</TableCell>
                        <TableCell>สถานะ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.lowStockList && reportData.lowStockList.length > 0 ? (
                        reportData.lowStockList.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{item.stock}</TableCell>
                            <TableCell align="right">{item.minStock}</TableCell>
                            <TableCell align="right">{item.suggestedOrder}</TableCell>
                            <TableCell>
                              <Chip 
                                label={item.stock === 0 ? 'หมดสต็อก' : 'ใกล้หมด'} 
                                color={item.stock === 0 ? 'error' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="text.secondary">ไม่มีสินค้าที่ต้องสั่งซื้อ</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Category Breakdown */}
                <Typography variant="h6" sx={{ mb: 2 }}>📦 สรุปตามหมวดหมู่</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>หมวดหมู่</TableCell>
                        <TableCell align="right">จำนวนรายการ</TableCell>
                        <TableCell align="right">มูลค่ารวม</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.categoryBreakdown && Object.entries(reportData.categoryBreakdown).map(([category, data]: [string, any]) => {
                        const categoryName = {
                          'injections': 'เครื่องฉีด/ยา',
                          'skincare': 'ผลิตภัณฑ์ดูแลผิว',
                          'supplements': 'อาหารเสริม',
                          'equipment': 'อุปกรณ์',
                          'other': 'อื่นๆ'
                        }[category] || category;
                        return (
                          <TableRow key={category}>
                            <TableCell>{categoryName}</TableCell>
                            <TableCell align="right">{data.count}</TableCell>
                            <TableCell align="right">฿{data.value?.toLocaleString() || 0}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="info">กรุณากดปุ่มรายงานอีกครั้งเพื่อโหลดข้อมูล</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>ปิด</Button>
          <Button 
            variant="contained" 
            startIcon={<TrendingUp />}
            onClick={() => showNotification('ฟีเจอร์ส่งออก Excel กำลังพัฒนา', 'info')}
          >
            ส่งออก Excel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Order Dialog */}
      <Dialog 
        open={purchaseDialogOpen} 
        onClose={() => setPurchaseDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          🛒 สั่งซื้อสินค้า
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              เลือกสินค้าที่ต้องการสั่งซื้อ ระบบจะแนะนำจำนวนที่ควรสั่งโดยอัตโนมัติ
            </Alert>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      {/* Select All Checkbox */}
                    </TableCell>
                    <TableCell>รหัสสินค้า</TableCell>
                    <TableCell>ชื่อสินค้า</TableCell>
                    <TableCell align="right">คงเหลือ</TableCell>
                    <TableCell align="right">ขั้นต่ำ</TableCell>
                    <TableCell align="right">จำนวนที่สั่ง</TableCell>
                    <TableCell align="right">ราคา/หน่วย</TableCell>
                    <TableCell align="right">รวม</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products
                    .filter(p => p.stock <= p.minStock)
                    .map((product) => {
                      const suggestedQty = Math.max(product.minStock * 2 - product.stock, 0);
                      return (
                        <TableRow key={product.id}>
                          <TableCell padding="checkbox">
                            <input type="checkbox" defaultChecked />
                          </TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">{product.stock}</TableCell>
                          <TableCell align="right">{product.minStock}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              defaultValue={suggestedQty}
                              sx={{ width: 80 }}
                              inputProps={{ min: 0 }}
                            />
                          </TableCell>
                          <TableCell align="right">฿{product.cost?.toLocaleString() || 0}</TableCell>
                          <TableCell align="right">
                            ฿{((product.cost || 0) * suggestedQty).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {products.filter(p => p.stock <= p.minStock).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">ไม่มีสินค้าที่ต้องสั่งซื้อในขณะนี้</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {products.filter(p => p.stock <= p.minStock).length > 0 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="primary.contrastText">ยอดรวมทั้งหมด:</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.contrastText">
                    ฿{products
                      .filter(p => p.stock <= p.minStock)
                      .reduce((sum, p) => {
                        const suggestedQty = Math.max(p.minStock * 2 - p.stock, 0);
                        return sum + ((p.cost || 0) * suggestedQty);
                      }, 0)
                      .toLocaleString()}
                  </Typography>
                </Stack>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              label="หมายเหตุ"
              placeholder="ระบุข้อมูลเพิ่มเติม เช่น ผู้ขาย, เงื่อนไขการชำระเงิน"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            startIcon={<ShoppingCart />}
            onClick={() => {
              const lowStockProducts = products.filter(p => p.stock <= p.minStock);
              const selectedItems = lowStockProducts.map(p => ({
                id: p.id,
                quantity: Math.max(p.minStock * 2 - p.stock, 0)
              }));
              handleCreatePurchaseOrder(selectedItems);
            }}
            disabled={products.filter(p => p.stock <= p.minStock).length === 0}
          >
            สร้างใบสั่งซื้อ
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Inventory;