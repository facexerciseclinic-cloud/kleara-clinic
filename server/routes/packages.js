const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const PackagePurchase = require('../models/PackagePurchase');
const { auth, requireRole } = require('../middleware/auth');

// @route   GET /api/packages
// @desc    Get all packages
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, membershipTier, isActive } = req.query;
    
    let query = {};
    
    if (type) query.type = type;
    if (membershipTier) query.membershipTier = membershipTier;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const packages = await Package.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: packages
    });
    
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages'
    });
  }
});

// @route   GET /api/packages/available
// @desc    Get available packages (active and not expired)
// @access  Public
router.get('/available', async (req, res) => {
  try {
    const now = new Date();
    
    const packages = await Package.find({
      isActive: true,
      $or: [
        { availableFrom: { $lte: now } },
        { availableFrom: { $exists: false } }
      ],
      $or: [
        { availableTo: { $gte: now } },
        { availableTo: { $exists: false } }
      ]
    }).sort({ 'price.selling': 1 });
    
    // Filter by max purchases
    const availablePackages = packages.filter(pkg => {
      if (!pkg.maxPurchases) return true;
      return pkg.currentPurchases < pkg.maxPurchases;
    });
    
    res.json({
      success: true,
      data: availablePackages
    });
    
  } catch (error) {
    console.error('Get available packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available packages'
    });
  }
});

// @route   GET /api/packages/:id
// @desc    Get package by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    res.json({
      success: true,
      data: package
    });
    
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package'
    });
  }
});

// @route   POST /api/packages
// @desc    Create new package
// @access  Private (Admin only)
router.post('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const packageData = req.body;
    
    // Calculate validity date
    if (packageData.validity) {
      const validFrom = new Date();
      let validUntil = new Date();
      
      switch (packageData.validity.type) {
        case 'days':
          validUntil.setDate(validUntil.getDate() + packageData.validity.value);
          break;
        case 'months':
          validUntil.setMonth(validUntil.getMonth() + packageData.validity.value);
          break;
        case 'years':
          validUntil.setFullYear(validUntil.getFullYear() + packageData.validity.value);
          break;
      }
    }
    
    const package = new Package(packageData);
    await package.save();
    
    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: package
    });
    
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create package',
      error: error.message
    });
  }
});

// @route   PUT /api/packages/:id
// @desc    Update package
// @access  Private (Admin only)
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const package = await Package.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Package updated successfully',
      data: package
    });
    
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update package'
    });
  }
});

// @route   DELETE /api/packages/:id
// @desc    Delete package
// @access  Private (Admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const package = await Package.findByIdAndDelete(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete package'
    });
  }
});

// =====================================================
// Package Purchase Endpoints
// =====================================================

// @route   POST /api/packages/purchase
// @desc    Purchase a package
// @access  Private
router.post('/purchase', auth, async (req, res) => {
  try {
    const { packageId, patientId, paymentMethod, transactionId, notes } = req.body;
    
    const package = await Package.findById(packageId);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    if (!package.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Package is not available'
      });
    }
    
    // Calculate validity dates
    const validFrom = new Date();
    let validUntil = new Date();
    
    switch (package.validity.type) {
      case 'days':
        validUntil.setDate(validUntil.getDate() + package.validity.value);
        break;
      case 'months':
        validUntil.setMonth(validUntil.getMonth() + package.validity.value);
        break;
      case 'years':
        validUntil.setFullYear(validUntil.getFullYear() + package.validity.value);
        break;
      case 'unlimited':
        validUntil = new Date('2099-12-31');
        break;
    }
    
    // Create purchase record
    const purchase = new PackagePurchase({
      package: packageId,
      patient: patientId,
      price: {
        original: package.price.original,
        paid: package.price.selling,
        discount: package.price.discount
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
      transactionId,
      validFrom,
      validUntil,
      services: package.services.map(service => ({
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        totalQuantity: service.quantity,
        usedQuantity: 0,
        remainingQuantity: service.quantity,
        usageHistory: []
      })),
      notes,
      soldBy: req.user.id
    });
    
    await purchase.save();
    
    // Update package purchase count
    package.currentPurchases += 1;
    await package.save();
    
    res.status(201).json({
      success: true,
      message: 'Package purchased successfully',
      data: purchase
    });
    
  } catch (error) {
    console.error('Purchase package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase package',
      error: error.message
    });
  }
});

// @route   GET /api/packages/purchases/patient/:patientId
// @desc    Get patient's package purchases
// @access  Private
router.get('/purchases/patient/:patientId', auth, async (req, res) => {
  try {
    const purchases = await PackagePurchase.find({
      patient: req.params.patientId
    })
    .populate('package', 'name type')
    .populate('patient', 'firstName lastName')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: purchases
    });
    
  } catch (error) {
    console.error('Get patient purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases'
    });
  }
});

// @route   GET /api/packages/purchases/:id
// @desc    Get purchase details
// @access  Private
router.get('/purchases/:id', auth, async (req, res) => {
  try {
    const purchase = await PackagePurchase.findById(req.params.id)
      .populate('package')
      .populate('patient', 'firstName lastName phoneNumber email')
      .populate('soldBy', 'firstName lastName');
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    res.json({
      success: true,
      data: purchase
    });
    
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase'
    });
  }
});

// @route   POST /api/packages/purchases/:id/use-service
// @desc    Use service from package
// @access  Private
router.post('/purchases/:id/use-service', auth, async (req, res) => {
  try {
    const { serviceId, quantity, appointmentId, notes } = req.body;
    
    const purchase = await PackagePurchase.findById(req.params.id);
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    try {
      await purchase.useService(serviceId, quantity, appointmentId, notes);
      
      res.json({
        success: true,
        message: 'Service used successfully',
        data: purchase
      });
      
    } catch (usageError) {
      return res.status(400).json({
        success: false,
        message: usageError.message
      });
    }
    
  } catch (error) {
    console.error('Use service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use service'
    });
  }
});

// @route   GET /api/packages/purchases/active/:patientId
// @desc    Get patient's active packages
// @access  Private
router.get('/purchases/active/:patientId', auth, async (req, res) => {
  try {
    const now = new Date();
    
    const activePurchases = await PackagePurchase.find({
      patient: req.params.patientId,
      status: 'active',
      validUntil: { $gte: now }
    })
    .populate('package', 'name type')
    .sort({ validUntil: 1 });
    
    res.json({
      success: true,
      data: activePurchases
    });
    
  } catch (error) {
    console.error('Get active purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active purchases'
    });
  }
});

module.exports = router;
