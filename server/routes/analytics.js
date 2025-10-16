const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const Product = require('../models/Product');
const PackagePurchase = require('../models/PackagePurchase');

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics overview
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Revenue analytics
    const revenueData = await Bill.aggregate([
      { $match: { ...dateFilter, status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 },
          averageBill: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    // Patient analytics
    const totalPatients = await Patient.countDocuments(dateFilter);
    const newPatients = await Patient.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    });
    
    // Appointment analytics
    const appointmentStats = await Appointment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Treatment analytics
    const popularTreatments = await Treatment.aggregate([
      { $match: dateFilter },
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services.serviceName',
          count: { $sum: 1 },
          revenue: { $sum: '$services.price' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Package sales
    const packageSales = await PackagePurchase.countDocuments({
      ...dateFilter,
      paymentStatus: 'paid'
    });
    
    const packageRevenue = await PackagePurchase.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$price.paid' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        revenue: {
          total: revenueData[0]?.totalRevenue || 0,
          bills: revenueData[0]?.totalBills || 0,
          average: revenueData[0]?.averageBill || 0,
          packageSales: packageRevenue[0]?.total || 0
        },
        patients: {
          total: totalPatients,
          new: newPatients
        },
        appointments: appointmentStats,
        popularTreatments,
        packages: {
          sold: packageSales,
          revenue: packageRevenue[0]?.total || 0
        }
      }
    });
    
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/revenue
// @desc    Get detailed revenue analytics
// @access  Private (Admin only)
router.get('/revenue', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const matchStage = { status: 'paid' };
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Group format based on groupBy parameter
    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'year':
        groupFormat = {
          year: { $year: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
    
    const revenueByPeriod = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$totalAmount' },
          bills: { $sum: 1 },
          averageBill: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Revenue by payment method
    const revenueByPaymentMethod = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Revenue by service category
    const revenueByCategory = await Treatment.aggregate([
      { $match: matchStage },
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services.category',
          revenue: { $sum: '$services.price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        byPeriod: revenueByPeriod,
        byPaymentMethod: revenueByPaymentMethod,
        byCategory: revenueByCategory
      }
    });
    
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics'
    });
  }
});

// @route   GET /api/analytics/customer-retention
// @desc    Get customer retention metrics
// @access  Private (Admin only)
router.get('/customer-retention', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    // Calculate retention rate
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    // New customers per month
    const newCustomersPerMonth = await Patient.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Repeat customers (more than 1 appointment)
    const repeatCustomers = await Appointment.aggregate([
      {
        $group: {
          _id: '$patient',
          appointmentCount: { $sum: 1 }
        }
      },
      {
        $match: {
          appointmentCount: { $gt: 1 }
        }
      },
      {
        $count: 'repeatCustomers'
      }
    ]);
    
    // Customer lifetime value
    const customerLifetimeValue = await Bill.aggregate([
      {
        $group: {
          _id: '$patient',
          totalSpent: { $sum: '$totalAmount' },
          visits: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          averageLTV: { $avg: '$totalSpent' },
          averageVisits: { $avg: '$visits' }
        }
      }
    ]);
    
    // Churn rate (customers who haven't returned in 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const churnedCustomers = await Appointment.aggregate([
      {
        $group: {
          _id: '$patient',
          lastAppointment: { $max: '$appointmentDate' }
        }
      },
      {
        $match: {
          lastAppointment: { $lt: ninetyDaysAgo }
        }
      },
      {
        $count: 'churnedCustomers'
      }
    ]);
    
    const totalCustomers = await Patient.countDocuments();
    const churnRate = totalCustomers > 0 ? ((churnedCustomers[0]?.churnedCustomers || 0) / totalCustomers * 100) : 0;
    
    res.json({
      success: true,
      data: {
        newCustomersPerMonth,
        repeatCustomers: repeatCustomers[0]?.repeatCustomers || 0,
        totalCustomers,
        retentionRate: totalCustomers > 0 ? ((repeatCustomers[0]?.repeatCustomers || 0) / totalCustomers * 100) : 0,
        churnRate: churnRate.toFixed(2),
        averageLifetimeValue: customerLifetimeValue[0]?.averageLTV || 0,
        averageVisits: customerLifetimeValue[0]?.averageVisits || 0
      }
    });
    
  } catch (error) {
    console.error('Customer retention error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer retention metrics'
    });
  }
});

// @route   GET /api/analytics/inventory
// @desc    Get inventory analytics
// @access  Private
router.get('/inventory', auth, async (req, res) => {
  try {
    // Inventory value
    const inventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$currentStock', '$cost'] } },
          totalItems: { $sum: '$currentStock' }
        }
      }
    ]);
    
    // Low stock items
    const lowStockItems = await Product.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStock'] }
    });
    
    // Out of stock
    const outOfStock = await Product.countDocuments({
      currentStock: 0
    });
    
    // Fast moving items (high turnover)
    const fastMovingItems = await Product.find()
      .sort({ 'analytics.turnoverRate': -1 })
      .limit(10)
      .select('name currentStock minStock analytics');
    
    // Slow moving items
    const slowMovingItems = await Product.find({
      'analytics.turnoverRate': { $lt: 1 }
    })
    .limit(10)
    .select('name currentStock analytics');
    
    res.json({
      success: true,
      data: {
        totalValue: inventoryValue[0]?.totalValue || 0,
        totalItems: inventoryValue[0]?.totalItems || 0,
        lowStockItems,
        outOfStock,
        fastMovingItems,
        slowMovingItems
      }
    });
    
  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory analytics'
    });
  }
});

// @route   GET /api/analytics/staff-performance
// @desc    Get staff performance metrics
// @access  Private (Admin only)
router.get('/staff-performance', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Appointments by doctor
    const appointmentsByDoctor = await Appointment.aggregate([
      { $match: { ...dateFilter, status: { $in: ['completed', 'in-progress'] } } },
      {
        $group: {
          _id: '$assignedStaff.doctor',
          appointments: { $sum: 1 }
        }
      },
      { $sort: { appointments: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $project: {
          doctorName: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] },
          appointments: 1
        }
      }
    ]);
    
    // Revenue by doctor
    const revenueByDoctor = await Treatment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$doctor',
          revenue: { $sum: '$totalCost' },
          treatments: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $project: {
          doctorName: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] },
          revenue: 1,
          treatments: 1,
          averagePerTreatment: { $divide: ['$revenue', '$treatments'] }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        appointmentsByDoctor,
        revenueByDoctor
      }
    });
    
  } catch (error) {
    console.error('Staff performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff performance metrics'
    });
  }
});

// @route   GET /api/analytics/predictive/demand
// @desc    Predict future demand (simple forecasting)
// @access  Private (Admin only)
router.get('/predictive/demand', auth, requireRole(['admin']), async (req, res) => {
  try {
    // Get historical data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const historicalData = await Appointment.aggregate([
      { $match: { appointmentDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Simple moving average for next month prediction
    const counts = historicalData.map(d => d.count);
    const averageAppointments = counts.length > 0 
      ? counts.reduce((a, b) => a + b, 0) / counts.length 
      : 0;
    
    // Trend calculation (simple linear regression)
    let trend = 0;
    if (counts.length >= 2) {
      trend = (counts[counts.length - 1] - counts[0]) / counts.length;
    }
    
    const predictedNextMonth = Math.round(averageAppointments + trend);
    
    res.json({
      success: true,
      data: {
        historicalData,
        averageMonthlyAppointments: Math.round(averageAppointments),
        trend: trend.toFixed(2),
        predictedNextMonth,
        confidence: 'medium' // Simple indicator
      }
    });
    
  } catch (error) {
    console.error('Predictive demand error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate demand forecast'
    });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data (CSV format)
// @access  Private (Admin only)
router.get('/export', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let data = [];
    let headers = [];
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    switch (type) {
      case 'revenue':
        data = await Bill.find(dateFilter)
          .populate('patient', 'firstName lastName')
          .select('billNumber totalAmount paymentMethod status createdAt');
        headers = ['Bill Number', 'Patient', 'Amount', 'Payment Method', 'Status', 'Date'];
        break;
        
      case 'appointments':
        data = await Appointment.find(dateFilter)
          .populate('patient', 'firstName lastName')
          .select('appointmentNumber appointmentDate status');
        headers = ['Appointment Number', 'Patient', 'Date', 'Status'];
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }
    
    // Convert to CSV
    const csv = [
      headers.join(','),
      ...data.map(item => {
        const row = [];
        if (type === 'revenue') {
          row.push(item.billNumber);
          row.push(`${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`);
          row.push(item.totalAmount);
          row.push(item.paymentMethod);
          row.push(item.status);
          row.push(item.createdAt.toISOString().split('T')[0]);
        } else if (type === 'appointments') {
          row.push(item.appointmentNumber);
          row.push(`${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`);
          row.push(item.appointmentDate.toISOString().split('T')[0]);
          row.push(item.status);
        }
        return row.join(',');
      })
    ].join('\n');
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.csv"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
    });
  }
});

module.exports = router;
