const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');

// Import models
const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const Product = require('../models/Product');
const User = require('../models/User');

// @route   GET /api/reports/dashboard
// @desc    Get dashboard overview data
// @access  Private
router.get('/dashboard', auth, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Today's statistics
    const todayStats = await Promise.all([
      // Appointments today
      Appointment.countDocuments({
        appointmentDate: { $gte: startOfDay, $lte: endOfDay }
      }),
      
      // Treatments today
      Treatment.countDocuments({
        treatmentDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed'
      }),
      
      // Revenue today
      Bill.aggregate([
        {
          $match: {
            billDate: { $gte: startOfDay, $lte: endOfDay },
            status: 'confirmed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.grandTotal' },
            totalPaid: { $sum: '$paidAmount' }
          }
        }
      ]),
      
      // New patients today
      Patient.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      })
    ]);

    // Monthly statistics
    const monthlyStats = await Promise.all([
      // Monthly revenue
      Bill.aggregate([
        {
          $match: {
            billDate: { $gte: startOfMonth },
            status: 'confirmed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.grandTotal' },
            totalPaid: { $sum: '$paidAmount' }
          }
        }
      ]),
      
      // Monthly appointments
      Appointment.countDocuments({
        appointmentDate: { $gte: startOfMonth }
      }),
      
      // Monthly new patients
      Patient.countDocuments({
        createdAt: { $gte: startOfMonth }
      })
    ]);

    // Quick stats
    const quickStats = await Promise.all([
      // Total patients
      Patient.countDocuments({ isActive: true }),
      
      // Total staff
      User.countDocuments({ isActive: true }),
      
      // Low stock products
      Product.find({ isActive: true }).then(products => 
        products.filter(p => p.isLowStock).length
      ),
      
      // Near expiry products
      Product.find({ isActive: true }).then(products => 
        products.filter(p => p.hasNearExpiryLots).length
      )
    ]);

    // Recent activities (last 10)
    const recentActivities = await Promise.all([
      Appointment.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
        .populate('patient', 'hn profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('appointmentNumber patient appointmentDate timeSlot status createdAt'),
      
      Treatment.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
        .populate('patient', 'hn profile.firstName profile.lastName')
        .populate('performedBy.doctor', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('treatmentId patient treatmentType status createdAt performedBy.doctor')
    ]);

    const dashboard = {
      today: {
        appointments: todayStats[0],
        treatments: todayStats[1],
        revenue: todayStats[2][0]?.totalRevenue || 0,
        paidAmount: todayStats[2][0]?.totalPaid || 0,
        newPatients: todayStats[3]
      },
      monthly: {
        revenue: monthlyStats[0][0]?.totalRevenue || 0,
        paidAmount: monthlyStats[0][0]?.totalPaid || 0,
        appointments: monthlyStats[1],
        newPatients: monthlyStats[2]
      },
      overview: {
        totalPatients: quickStats[0],
        totalStaff: quickStats[1],
        lowStockProducts: quickStats[2],
        nearExpiryProducts: quickStats[3]
      },
      recentActivities: {
        appointments: recentActivities[0],
        treatments: recentActivities[1]
      }
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating dashboard'
    });
  }
});

// @route   GET /api/reports/sales
// @desc    Get sales reports
// @access  Private
router.get('/sales', auth, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'day', // day, week, month
      paymentMethod,
      billType
    } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      dateFilter = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }

    // Build match query
    let matchQuery = {
      billDate: dateFilter,
      status: 'confirmed'
    };

    if (billType) {
      matchQuery.billType = billType;
    }

    // Sales summary
    const salesSummary = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.grandTotal' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$remainingAmount' },
          totalDiscount: { $sum: '$pricing.totalDiscount' },
          totalTax: { $sum: '$pricing.taxAmount' }
        }
      }
    ]);

    // Sales by period
    let groupFormat;
    switch (groupBy) {
      case 'week':
        groupFormat = { $isoWeek: '$billDate' };
        break;
      case 'month':
        groupFormat = { $month: '$billDate' };
        break;
      default:
        groupFormat = { $dayOfMonth: '$billDate' };
    }

    const salesByPeriod = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.grandTotal' },
          paid: { $sum: '$paidAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Payment methods breakdown
    const paymentMethodsBreakdown = await Bill.aggregate([
      { $match: matchQuery },
      { $unwind: '$payments' },
      ...(paymentMethod ? [{ $match: { 'payments.paymentMethod': paymentMethod } }] : []),
      {
        $group: {
          _id: '$payments.paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$payments.amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Top selling services/products
    const topItems = await Bill.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            name: '$items.name',
            type: '$items.type'
          },
          count: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          startDate: Object.values(dateFilter)[0],
          endDate: Object.values(dateFilter)[1]
        },
        summary: salesSummary[0] || {
          totalBills: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalDiscount: 0,
          totalTax: 0
        },
        salesByPeriod,
        paymentMethodsBreakdown,
        topItems
      }
    });

  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating sales report'
    });
  }
});

// @route   GET /api/reports/patients
// @desc    Get patient reports
// @access  Private
router.get('/patients', auth, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      membershipLevel,
      groupBy = 'month'
    } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current year
      const now = new Date();
      dateFilter = {
        $gte: new Date(now.getFullYear(), 0, 1),
        $lte: new Date(now.getFullYear(), 11, 31)
      };
    }

    // Patient demographics
    const demographics = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$profile.gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Membership levels
    const membershipStats = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$membershipInfo.level',
          count: { $sum: 1 },
          totalSpent: { $sum: '$membershipInfo.totalSpent' },
          avgSpent: { $avg: '$membershipInfo.totalSpent' }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    // New patients by period
    let groupFormat;
    switch (groupBy) {
      case 'week':
        groupFormat = { 
          year: { $year: '$createdAt' },
          week: { $isoWeek: '$createdAt' }
        };
        break;
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }

    const newPatientsByPeriod = await Patient.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top spending patients
    const topSpendingPatients = await Patient.find({
      isActive: true,
      ...(membershipLevel ? { 'membershipInfo.level': membershipLevel } : {})
    })
      .sort({ 'membershipInfo.totalSpent': -1 })
      .limit(10)
      .select('hn profile.firstName profile.lastName membershipInfo.totalSpent membershipInfo.level');

    // Inactive patients (no visit in last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const inactivePatients = await Patient.countDocuments({
      isActive: true,
      $or: [
        { lastVisit: { $lt: sixMonthsAgo } },
        { lastVisit: { $exists: false } }
      ]
    });

    res.json({
      success: true,
      data: {
        period: {
          startDate: Object.values(dateFilter)[0],
          endDate: Object.values(dateFilter)[1]
        },
        demographics,
        membershipStats,
        newPatientsByPeriod,
        topSpendingPatients,
        inactivePatients
      }
    });

  } catch (error) {
    console.error('Patient report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating patient report'
    });
  }
});

// @route   GET /api/reports/treatments
// @desc    Get treatment reports
// @access  Private
router.get('/treatments', auth, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      treatmentType,
      doctor
    } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      dateFilter = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }

    let matchQuery = {
      treatmentDate: dateFilter,
      status: 'completed'
    };

    if (treatmentType) {
      matchQuery.treatmentType = treatmentType;
    }

    if (doctor) {
      matchQuery['performedBy.doctor'] = doctor;
    }

    // Treatment summary
    const treatmentSummary = await Treatment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalTreatments: { $sum: 1 },
          totalRevenue: { $sum: '$billing.totalCost' },
          avgSatisfaction: { $avg: '$results.patientSatisfaction' }
        }
      }
    ]);

    // Treatments by type
    const treatmentsByType = await Treatment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$treatmentType',
          count: { $sum: 1 },
          revenue: { $sum: '$billing.totalCost' },
          avgSatisfaction: { $avg: '$results.patientSatisfaction' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Treatments by doctor
    const treatmentsByDoctor = await Treatment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$performedBy.doctor',
          count: { $sum: 1 },
          revenue: { $sum: '$billing.totalCost' }
        }
      },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $project: {
          count: 1,
          revenue: 1,
          doctorName: {
            $concat: [
              { $arrayElemAt: ['$doctor.profile.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$doctor.profile.lastName', 0] }
            ]
          }
        }
      }
    ]);

    // Popular procedures
    const popularProcedures = await Treatment.aggregate([
      { $match: matchQuery },
      { $unwind: '$procedures' },
      {
        $group: {
          _id: '$procedures.procedureName',
          count: { $sum: 1 },
          totalCost: { $sum: '$procedures.cost' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          startDate: Object.values(dateFilter)[0],
          endDate: Object.values(dateFilter)[1]
        },
        summary: treatmentSummary[0] || {
          totalTreatments: 0,
          totalRevenue: 0,
          avgSatisfaction: 0
        },
        treatmentsByType,
        treatmentsByDoctor,
        popularProcedures
      }
    });

  } catch (error) {
    console.error('Treatment report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating treatment report'
    });
  }
});

// @route   GET /api/reports/inventory
// @desc    Get inventory reports
// @access  Private
router.get('/inventory', auth, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { category } = req.query;

    let matchQuery = { isActive: true };
    if (category) {
      matchQuery.category = category;
    }

    // Inventory overview
    const inventoryOverview = await Product.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockValue: { $sum: { $multiply: ['$inventory.currentStock', '$pricing.costPrice'] } },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lte: ['$inventory.currentStock', '$inventory.minStock'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Stock by category
    const stockByCategory = await Product.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          totalStock: { $sum: '$inventory.currentStock' },
          totalValue: { $sum: { $multiply: ['$inventory.currentStock', '$pricing.costPrice'] } }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Low stock products
    const lowStockProducts = await Product.find(matchQuery)
      .select('productCode name inventory.currentStock inventory.minStock')
      .then(products => 
        products
          .filter(p => p.inventory.currentStock <= p.inventory.minStock)
          .sort((a, b) => (a.inventory.currentStock - a.inventory.minStock) - (b.inventory.currentStock - b.inventory.minStock))
      );

    // Near expiry products
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const nearExpiryProducts = await Product.find(matchQuery)
      .select('productCode name lots')
      .then(products => {
        const nearExpiry = [];
        products.forEach(product => {
          product.lots.forEach(lot => {
            if (lot.status === 'active' && 
                lot.remainingQuantity > 0 && 
                lot.expiryDate <= thirtyDaysFromNow) {
              nearExpiry.push({
                productCode: product.productCode,
                productName: product.name,
                lotNumber: lot.lotNumber,
                expiryDate: lot.expiryDate,
                quantity: lot.remainingQuantity,
                daysToExpiry: Math.ceil((lot.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
              });
            }
          });
        });
        return nearExpiry.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
      });

    // Most used products (last 30 days)
    const mostUsedProducts = await Product.find(matchQuery)
      .select('productCode name usage.totalUsed usage.lastUsedDate')
      .sort({ 'usage.totalUsed': -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: inventoryOverview[0] || {
          totalProducts: 0,
          totalStockValue: 0,
          lowStockCount: 0
        },
        stockByCategory,
        lowStockProducts,
        nearExpiryProducts,
        mostUsedProducts
      }
    });

  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating inventory report'
    });
  }
});

module.exports = router;