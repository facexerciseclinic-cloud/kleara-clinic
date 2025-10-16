const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, checkPermission } = require('../middleware/auth');

// @route   GET /api/inventory/products
// @desc    Get all products with inventory info
// @access  Private
router.get('/products', auth, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      lowStock = false,
      nearExpiry = false
    } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;

    if (search) {
      query.$or = [
        { 'name.th': { $regex: search, $options: 'i' } },
        { 'name.en': { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    let products = await Product.find(query)
      .sort({ 'name.th': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by low stock if requested
    if (lowStock === 'true') {
      products = products.filter(product => product.isLowStock);
    }

    // Filter by near expiry if requested
    if (nearExpiry === 'true') {
      products = products.filter(product => product.hasNearExpiryLots);
    }

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// @route   GET /api/inventory/products/:id
// @desc    Get single product with full details
// @access  Private
router.get('/products/:id', auth, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
});

// @route   POST /api/inventory/products
// @desc    Create new product
// @access  Private
router.post('/products', auth, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    req.body.createdBy = req.user._id;

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
});

// @route   PUT /api/inventory/products/:id
// @desc    Update product
// @access  Private
router.put('/products/:id', auth, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    req.body.updatedBy = req.user._id;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
});

// @route   POST /api/inventory/products/:id/stock-in
// @desc    Add stock to product
// @access  Private
router.post('/products/:id/stock-in', auth, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const {
      quantity,
      lotNumber,
      expiryDate,
      manufacturingDate,
      supplier,
      purchasePrice
    } = req.body;

    if (!quantity || !lotNumber || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Quantity, lot number, and expiry date are required'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if lot number already exists
    const existingLot = product.lots.find(lot => lot.lotNumber === lotNumber);
    if (existingLot) {
      return res.status(400).json({
        success: false,
        message: 'Lot number already exists for this product'
      });
    }

    // Add new lot
    const newLot = {
      lotNumber,
      expiryDate: new Date(expiryDate),
      manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
      quantity: parseInt(quantity),
      remainingQuantity: parseInt(quantity),
      supplier,
      purchaseDate: new Date(),
      purchasePrice: purchasePrice || product.pricing.costPrice
    };

    product.lots.push(newLot);
    product.inventory.currentStock += parseInt(quantity);

    await product.save();

    res.json({
      success: true,
      message: 'Stock added successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Stock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding stock'
    });
  }
});

// @route   POST /api/inventory/products/:id/stock-out
// @desc    Remove stock from product
// @access  Private
router.post('/products/:id/stock-out', auth, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { quantity, reason, lotNumber } = req.body;

    if (!quantity || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and reason are required'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    let remainingQuantityToRemove = parseInt(quantity);

    if (lotNumber) {
      // Remove from specific lot
      const lot = product.lots.find(l => l.lotNumber === lotNumber);
      if (!lot) {
        return res.status(404).json({
          success: false,
          message: 'Lot not found'
        });
      }

      if (lot.remainingQuantity < remainingQuantityToRemove) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient quantity in specified lot'
        });
      }

      lot.remainingQuantity -= remainingQuantityToRemove;
      remainingQuantityToRemove = 0;
    } else {
      // Remove from lots using FEFO (First Expired, First Out)
      const activeLots = product.lots
        .filter(lot => lot.status === 'active' && lot.remainingQuantity > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      for (const lot of activeLots) {
        if (remainingQuantityToRemove <= 0) break;

        const quantityFromThisLot = Math.min(lot.remainingQuantity, remainingQuantityToRemove);
        lot.remainingQuantity -= quantityFromThisLot;
        remainingQuantityToRemove -= quantityFromThisLot;
      }
    }

    product.inventory.currentStock -= parseInt(quantity);
    product.updateUsage(parseInt(quantity));

    await product.save();

    res.json({
      success: true,
      message: 'Stock removed successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Stock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing stock'
    });
  }
});

// @route   GET /api/inventory/alerts
// @desc    Get inventory alerts (low stock, near expiry)
// @access  Private
router.get('/alerts', auth, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });

    const alerts = {
      lowStock: [],
      nearExpiry: [],
      expired: []
    };

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    products.forEach(product => {
      // Low stock alert
      if (product.isLowStock) {
        alerts.lowStock.push({
          productId: product._id,
          productCode: product.productCode,
          name: product.name,
          currentStock: product.inventory.currentStock,
          minStock: product.inventory.minStock
        });
      }

      // Near expiry and expired alerts
      product.lots.forEach(lot => {
        if (lot.status === 'active' && lot.remainingQuantity > 0) {
          if (lot.expiryDate <= now) {
            alerts.expired.push({
              productId: product._id,
              productCode: product.productCode,
              name: product.name,
              lotNumber: lot.lotNumber,
              expiryDate: lot.expiryDate,
              quantity: lot.remainingQuantity
            });
          } else if (lot.expiryDate <= thirtyDaysFromNow) {
            alerts.nearExpiry.push({
              productId: product._id,
              productCode: product.productCode,
              name: product.name,
              lotNumber: lot.lotNumber,
              expiryDate: lot.expiryDate,
              quantity: lot.remainingQuantity,
              daysToExpiry: Math.ceil((lot.expiryDate - now) / (1000 * 60 * 60 * 24))
            });
          }
        }
      });
    });

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          lowStockCount: alerts.lowStock.length,
          nearExpiryCount: alerts.nearExpiry.length,
          expiredCount: alerts.expired.length
        }
      }
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching alerts'
    });
  }
});

// @route   PUT /api/inventory/lots/:productId/:lotId/status
// @desc    Update lot status (mark as expired/recalled)
// @access  Private
router.put('/lots/:productId/:lotId/status', auth, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'expired', 'recalled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const lot = product.lots.id(req.params.lotId);

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Lot not found'
      });
    }

    lot.status = status;

    // If marking as expired or recalled, adjust inventory
    if ((status === 'expired' || status === 'recalled') && lot.remainingQuantity > 0) {
      product.inventory.currentStock -= lot.remainingQuantity;
      lot.remainingQuantity = 0;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Lot status updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Update lot status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lot status'
    });
  }
});

// @route   GET /api/inventory/reports
// @desc    Get inventory reports and analytics
// @access  Private
router.get('/reports', auth, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });

    // Calculate summary statistics
    const totalValue = products.reduce((sum, p) => {
      const stock = p.lots?.reduce((s, lot) => s + lot.quantity, 0) || 0;
      return sum + (stock * (p.price?.retail || 0));
    }, 0);

    const totalItems = products.length;
    const lowStockItems = products.filter(p => p.isLowStock).length;
    const outOfStockItems = products.filter(p => {
      const totalStock = p.lots?.reduce((s, lot) => s + lot.quantity, 0) || 0;
      return totalStock === 0;
    }).length;

    // Group by category
    const categoryBreakdown = {};
    products.forEach(p => {
      const cat = p.category || 'other';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = {
          count: 0,
          value: 0
        };
      }
      const stock = p.lots?.reduce((s, lot) => s + lot.quantity, 0) || 0;
      categoryBreakdown[cat].count++;
      categoryBreakdown[cat].value += stock * (p.price?.retail || 0);
    });

    // Low stock items list
    const lowStockList = products
      .filter(p => p.isLowStock)
      .map(p => {
        const stock = p.lots?.reduce((s, lot) => s + lot.quantity, 0) || 0;
        const minStock = p.reorderPoint || 10;
        return {
          id: p._id,
          sku: p.productCode,
          name: p.name?.th || p.name?.en,
          stock,
          minStock,
          suggestedOrder: Math.max(minStock * 2 - stock, 0),
          cost: p.price?.cost || 0
        };
      });

    res.json({
      success: true,
      data: {
        summary: {
          totalValue,
          totalItems,
          lowStockItems,
          outOfStockItems
        },
        categoryBreakdown,
        lowStockList
      }
    });

  } catch (error) {
    console.error('Get inventory reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating reports'
    });
  }
});

// @route   POST /api/inventory/purchase-orders
// @desc    Create a purchase order
// @access  Private
router.post('/purchase-orders', auth, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { items, notes, supplier } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      const itemTotal = (product.price?.cost || 0) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        productCode: product.productCode,
        productName: product.name?.th || product.name?.en,
        quantity: item.quantity,
        unitCost: product.price?.cost || 0,
        totalCost: itemTotal
      });
    }

    // Create purchase order object (you can save to DB if you have PurchaseOrder model)
    const purchaseOrder = {
      orderNumber: `PO-${Date.now()}`,
      items: orderItems,
      totalAmount,
      supplier: supplier || 'TBD',
      notes: notes || '',
      status: 'pending',
      createdBy: req.user.id,
      createdAt: new Date()
    };

    // For now, just return the order (you can implement saving to DB later)
    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });

  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating purchase order'
    });
  }
});

module.exports = router;