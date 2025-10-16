const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Service = require('../models/Service');
const { auth, checkPermission } = require('../middleware/auth');

// @route   GET /api/services
// @desc    Get all services and products for POS
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const category = req.query.category;
    const search = req.query.search || '';

    // Fetch services (treatments)
    let servicesQuery = Service.find({ isActive: true });
    if (search) {
      servicesQuery = servicesQuery.or([
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ]);
    }
    const services = await servicesQuery.select('name price category description duration code');

    // Fetch products (if category includes products)
    let productsQuery = Product.find({ isActive: true });
    if (search) {
      productsQuery = productsQuery.or([
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ]);
    }
    const products = await productsQuery.select('name price category description quantity sku barcode');

    // Combine and transform data
    const items = [];

    // Add services
    services.forEach(service => {
      items.push({
        id: service._id,
        name: service.name,
        price: service.price,
        category: 'treatment',
        description: service.description || '',
        commission: 15, // Default commission
        stock: null,
        barcode: service.code || '',
        duration: service.duration || 60,
        type: 'service'
      });
    });

    // Add products
    products.forEach(product => {
      items.push({
        id: product._id,
        name: product.name,
        price: product.price,
        category: 'product',
        description: product.description || '',
        commission: 25, // Default commission
        stock: product.quantity?.onHand || 0,
        barcode: product.barcode || product.sku || '',
        duration: null,
        type: 'product'
      });
    });

    // Filter by category if specified
    let filteredItems = items;
    if (category && category !== 'all') {
      filteredItems = items.filter(item => item.category === category);
    }

    res.json({
      success: true,
      data: filteredItems
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services'
    });
  }
});

// @route   GET /api/services/:id
// @desc    Get single service/product
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Try to find as service first
    let item = await Service.findById(req.params.id);
    let type = 'service';

    // If not found, try product
    if (!item) {
      item = await Product.findById(req.params.id);
      type = 'product';
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: item._id,
        name: item.name,
        price: item.price,
        category: type === 'service' ? 'treatment' : 'product',
        description: item.description || '',
        type: type
      }
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching service'
    });
  }
});

module.exports = router;
