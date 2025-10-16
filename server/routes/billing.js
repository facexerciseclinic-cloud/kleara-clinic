const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const Setting = require('../models/Setting');
const { auth, checkPermission } = require('../middleware/auth');

// @route   GET /api/billing
// @desc    Get bills with filters
// @access  Private
router.get('/', auth, checkPermission('billing', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      patient,
      billType,
      paymentStatus,
      startDate,
      endDate,
      search
    } = req.query;

    let query = { status: { $ne: 'voided' } };

    if (patient) query.patient = patient;
    if (billType) query.billType = billType;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate && endDate) {
      query.billDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const bills = await Bill.find(query)
      .populate('patient', 'hn profile.firstName profile.lastName profile.contact.phone')
      .populate('createdBy', 'profile.firstName profile.lastName')
      .sort({ billDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      data: {
        bills,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bills'
    });
  }
});

// @route   GET /api/billing/:id
// @desc    Get single bill
// @access  Private
router.get('/:id', auth, checkPermission('billing', 'read'), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patient')
      .populate('treatment')
      .populate('appointment')
      .populate('createdBy approvedBy', 'profile.firstName profile.lastName');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: {
        bill
      }
    });

  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bill'
    });
  }
});

// @route   POST /api/billing
// @desc    Create new bill
// @access  Private
router.post('/', auth, async (req, res) => {
  const { patientId, items, total, paymentMethod, notes } = req.body;

  try {
    const newBill = new Bill({
      patient: patientId,
      items,
      total,
      paymentMethod,
      notes,
      createdBy: req.user.id,
    });

    const bill = await newBill.save();

    // --- Loyalty Points Logic ---
    // 1. Get the loyalty point conversion rate from settings
    const loyaltySetting = await Setting.findOne({ key: 'loyalty_point_rate' });
    const conversionRate = loyaltySetting ? loyaltySetting.value : 0; // e.g., 10 baht = 1 point, rate would be 0.1

    if (conversionRate > 0 && total > 0) {
      // 2. Calculate points earned
      const pointsEarned = Math.floor(total * conversionRate);

      if (pointsEarned > 0) {
        // 3. Add points to the patient's account
        await Patient.findByIdAndUpdate(patientId, { $inc: { loyaltyPoints: pointsEarned } });
        
        // Optional: Add a log or notification about the points earned
        console.log(`Patient ${patientId} earned ${pointsEarned} points from bill ${bill._id}`);
      }
    }
    // --- End of Loyalty Points Logic ---

    res.json(bill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/billing/:id/payment
// @desc    Add payment to bill
// @access  Private
router.post('/:id/payment', auth, checkPermission('billing', 'write'), async (req, res) => {
  try {
    const { paymentMethod, amount, reference, cardNumber, bankName, approvalCode } = req.body;

    if (!paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment method and amount are required'
      });
    }

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (bill.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Bill is already fully paid'
      });
    }

    // Add payment
    const payment = {
      paymentMethod,
      amount,
      reference,
      cardNumber,
      bankName,
      approvalCode,
      processedBy: req.user._id
    };

    bill.payments.push(payment);
    bill.paidAmount += amount;

    // Update payment status
    if (bill.paidAmount >= bill.pricing.grandTotal) {
      bill.paymentStatus = 'paid';
    } else {
      bill.paymentStatus = 'partial';
    }

    bill.remainingAmount = bill.pricing.grandTotal - bill.paidAmount;

    await bill.save();

    res.json({
      success: true,
      message: 'Payment added successfully',
      data: {
        bill
      }
    });

  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding payment'
    });
  }
});

// @route   POST /api/billing/:id/refund
// @desc    Process refund
// @access  Private
router.post('/:id/refund', auth, checkPermission('billing', 'write'), async (req, res) => {
  try {
    const { amount, reason, method } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Amount and reason are required'
      });
    }

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (amount > bill.paidAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed paid amount'
      });
    }

    // Add refund
    const refund = {
      refundDate: new Date(),
      amount,
      reason,
      method: method || 'cash',
      processedBy: req.user._id
    };

    bill.refunds.push(refund);
    bill.paidAmount -= amount;
    bill.remainingAmount = bill.pricing.grandTotal - bill.paidAmount;

    // Update payment status
    if (bill.paidAmount === 0) {
      bill.paymentStatus = 'refunded';
    } else if (bill.paidAmount < bill.pricing.grandTotal) {
      bill.paymentStatus = 'partial';
    }

    await bill.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        bill
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing refund'
    });
  }
});

// @route   PUT /api/billing/:id/print
// @desc    Mark bill as printed
// @access  Private
router.put('/:id/print', auth, checkPermission('billing', 'read'), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    bill.printed.count += 1;
    bill.printed.lastPrintedAt = new Date();
    bill.printed.lastPrintedBy = req.user._id;

    await bill.save();

    res.json({
      success: true,
      message: 'Bill marked as printed'
    });

  } catch (error) {
    console.error('Mark as printed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking as printed'
    });
  }
});

// @route   GET /api/billing/reports/daily
// @desc    Get daily sales report
// @access  Private
router.get('/reports/daily', auth, checkPermission('billing', 'read'), async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    const bills = await Bill.find({
      billDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'confirmed'
    });

    const summary = {
      totalBills: bills.length,
      totalRevenue: bills.reduce((sum, bill) => sum + bill.pricing.grandTotal, 0),
      totalPaid: bills.reduce((sum, bill) => sum + bill.paidAmount, 0),
      totalOutstanding: bills.reduce((sum, bill) => sum + bill.remainingAmount, 0),
      paymentMethods: {},
      billTypes: {}
    };

    // Group by payment methods
    bills.forEach(bill => {
      bill.payments.forEach(payment => {
        summary.paymentMethods[payment.paymentMethod] = 
          (summary.paymentMethods[payment.paymentMethod] || 0) + payment.amount;
      });

      summary.billTypes[bill.billType] = 
        (summary.billTypes[bill.billType] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        summary,
        bills
      }
    });

  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating daily report'
    });
  }
});

module.exports = router;