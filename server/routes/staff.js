const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, checkPermission, requireRole } = require('../middleware/auth');

// @route   GET /api/staff
// @desc    Get all staff members
// @access  Private (Manager/Admin only)
router.get('/', auth, checkPermission('staff', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      isActive = true
    } = req.query;

    let query = {};

    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const staff = await User.find(query)
      .select('-password')
      .sort({ 'profile.firstName': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff'
    });
  }
});

// @route   GET /api/staff/:id
// @desc    Get single staff member
// @access  Private
router.get('/:id', auth, checkPermission('staff', 'read'), async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff member'
    });
  }
});

// @route   PUT /api/staff/:id
// @desc    Update staff member
// @access  Private (Manager/Admin only)
router.put('/:id', auth, checkPermission('staff', 'write'), async (req, res) => {
  try {
    // Prevent updating certain sensitive fields
    const restrictedFields = ['password', 'employeeId', 'username', 'email', 'role'];
    restrictedFields.forEach(field => delete req.body[field]);

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating staff member'
    });
  }
});

// @route   PUT /api/staff/:id/permissions
// @desc    Update staff permissions
// @access  Private (Admin only)
router.put('/:id/permissions', auth, requireRole('admin'), async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating permissions'
    });
  }
});

// @route   PUT /api/staff/:id/status
// @desc    Activate/Deactivate staff member
// @access  Private (Admin only)
router.put('/:id/status', auth, requireRole('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: `Staff member ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
});

// @route   PUT /api/staff/:id/schedule
// @desc    Update staff schedule
// @access  Private
router.put('/:id/schedule', auth, async (req, res) => {
  try {
    // Staff can only update their own schedule, or manager/admin can update anyone's
    if (req.user._id.toString() !== req.params.id && 
        !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own schedule'
      });
    }

    const { schedule } = req.body;

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { schedule },
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating schedule'
    });
  }
});

// @route   GET /api/staff/doctors/available
// @desc    Get available doctors for a specific date/time
// @access  Private
router.get('/doctors/available', auth, checkPermission('staff', 'read'), async (req, res) => {
  try {
    const { date, timeSlot } = req.query;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Date and time slot are required'
      });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const [startTime, endTime] = timeSlot.split('-');

    // Find doctors who work on this day and time
    const availableDoctors = await User.find({
      role: 'doctor',
      isActive: true,
      'schedule.workingDays': dayOfWeek,
      'schedule.workingHours.start': { $lte: startTime },
      'schedule.workingHours.end': { $gte: endTime }
    }).select('employeeId profile specializations schedule');

    // TODO: Check against existing appointments to filter out busy doctors

    res.json({
      success: true,
      data: {
        availableDoctors
      }
    });

  } catch (error) {
    console.error('Get available doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available doctors'
    });
  }
});

// @route   GET /api/staff/performance/:id
// @desc    Get staff performance metrics
// @access  Private (Manager/Admin only)
router.get('/performance/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const staffId = req.params.id;

    const staff = await User.findById(staffId).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

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

    const performance = {
      staff: {
        name: staff.fullName,
        role: staff.role,
        employeeId: staff.employeeId
      },
      period: {
        startDate: Object.values(dateFilter)[0],
        endDate: Object.values(dateFilter)[1]
      },
      metrics: {}
    };

    // Performance metrics based on role
    if (staff.role === 'doctor') {
      // Get treatment statistics
      const Treatment = require('../models/Treatment');
      const treatments = await Treatment.find({
        'performedBy.doctor': staffId,
        treatmentDate: dateFilter
      });

      performance.metrics = {
        totalTreatments: treatments.length,
        completedTreatments: treatments.filter(t => t.status === 'completed').length,
        totalRevenue: treatments.reduce((sum, t) => sum + (t.billing?.totalCost || 0), 0),
        averageRating: treatments.reduce((sum, t) => sum + (t.results?.doctorSatisfaction || 0), 0) / treatments.length || 0,
        treatmentTypes: {}
      };

      // Group by treatment types
      treatments.forEach(treatment => {
        performance.metrics.treatmentTypes[treatment.treatmentType] = 
          (performance.metrics.treatmentTypes[treatment.treatmentType] || 0) + 1;
      });
    }

    if (['receptionist', 'manager'].includes(staff.role)) {
      // Get appointment statistics
      const Appointment = require('../models/Appointment');
      const appointments = await Appointment.find({
        bookedBy: staffId,
        appointmentDate: dateFilter
      });

      performance.metrics.appointmentsBooked = appointments.length;
      performance.metrics.appointmentStatuses = {};

      appointments.forEach(appointment => {
        performance.metrics.appointmentStatuses[appointment.status] = 
          (performance.metrics.appointmentStatuses[appointment.status] || 0) + 1;
      });
    }

    // Get commission earnings
    const Bill = require('../models/Bill');
    const bills = await Bill.find({
      billDate: dateFilter,
      $or: [
        { 'items.commission.doctor.staffId': staffId },
        { 'items.commission.therapist.staffId': staffId },
        { 'items.commission.sales.staffId': staffId }
      ]
    });

    let totalCommission = 0;
    bills.forEach(bill => {
      totalCommission += bill.getCommissionByStaff(staffId);
    });

    performance.metrics.totalCommission = totalCommission;

    res.json({
      success: true,
      data: {
        performance
      }
    });

  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching performance data'
    });
  }
});

// @route   GET /api/staff/:id/schedule
// @desc    Get staff member's work schedule
// @access  Private
router.get('/:id/schedule', auth, checkPermission('staff', 'read'), async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('schedule profile');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Default schedule if not set
    const defaultSchedule = {
      monday: { working: true, start: '09:00', end: '18:00' },
      tuesday: { working: true, start: '09:00', end: '18:00' },
      wednesday: { working: true, start: '09:00', end: '18:00' },
      thursday: { working: true, start: '09:00', end: '18:00' },
      friday: { working: true, start: '09:00', end: '18:00' },
      saturday: { working: false, start: '09:00', end: '18:00' },
      sunday: { working: false, start: '09:00', end: '18:00' }
    };

    res.json({
      success: true,
      data: {
        staffId: staff._id,
        name: `${staff.profile?.firstName} ${staff.profile?.lastName}`,
        schedule: staff.schedule || defaultSchedule
      }
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schedule'
    });
  }
});

// @route   PUT /api/staff/:id/schedule
// @desc    Update staff member's work schedule
// @access  Private (Manager/Admin only)
router.put('/:id/schedule', auth, checkPermission('staff', 'write'), async (req, res) => {
  try {
    const { schedule } = req.body;

    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: 'Schedule data is required'
      });
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { schedule },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: staff
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating schedule'
    });
  }
});

// @route   GET /api/staff/:id/permissions
// @desc    Get staff member's permissions
// @access  Private
router.get('/:id/permissions', auth, checkPermission('staff', 'read'), async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('permissions role profile');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Default permissions based on role
    const defaultPermissions = {
      admin: ['*'],
      doctor: ['patients', 'treatments', 'appointments', 'reports'],
      nurse: ['patients', 'treatments', 'appointments'],
      receptionist: ['patients', 'appointments', 'billing']
    };

    res.json({
      success: true,
      data: {
        staffId: staff._id,
        name: `${staff.profile?.firstName} ${staff.profile?.lastName}`,
        role: staff.role,
        permissions: staff.permissions || defaultPermissions[staff.role] || []
      }
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching permissions'
    });
  }
});

// @route   PUT /api/staff/:id/permissions
// @desc    Update staff member's permissions
// @access  Private (Admin only)
router.put('/:id/permissions', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required'
      });
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: staff
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating permissions'
    });
  }
});

// @route   POST /api/staff/:id/evaluations
// @desc    Create staff evaluation
// @access  Private (Manager/Admin only)
router.post('/:id/evaluations', auth, checkPermission('staff', 'write'), async (req, res) => {
  try {
    const {
      workQuality,
      responsibility,
      teamwork,
      customerService,
      comments
    } = req.body;

    const staff = await User.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Calculate average score
    const scores = [workQuality, responsibility, teamwork, customerService].filter(s => s);
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Determine rating level
    let rating = 'ดี';
    if (averageScore >= 4.5) rating = 'ดีเยี่ยม';
    else if (averageScore >= 3.5) rating = 'ดีมาก';
    else if (averageScore >= 2.5) rating = 'ดี';
    else if (averageScore >= 1.5) rating = 'ปานกลาง';
    else rating = 'ต้องปรับปรุง';

    const evaluation = {
      staffId: staff._id,
      staffName: `${staff.profile?.firstName} ${staff.profile?.lastName}`,
      evaluatorId: req.user.id,
      evaluatorName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}`,
      scores: {
        workQuality,
        responsibility,
        teamwork,
        customerService
      },
      averageScore,
      rating,
      comments,
      evaluatedAt: new Date()
    };

    // In production, save to Evaluation model
    // For now, just return the evaluation
    res.status(201).json({
      success: true,
      message: 'Evaluation created successfully',
      data: evaluation
    });

  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating evaluation'
    });
  }
});

// @route   GET /api/staff/:id/evaluations
// @desc    Get staff evaluation history
// @access  Private
router.get('/:id/evaluations', auth, checkPermission('staff', 'read'), async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('profile');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // In production, fetch from Evaluation model
    // For now, return sample data
    const evaluations = [
      {
        id: 1,
        evaluatedAt: new Date(),
        averageScore: 4.5,
        rating: 'ดีมาก',
        evaluatorName: 'ผู้จัดการ'
      }
    ];

    res.json({
      success: true,
      data: {
        staffId: staff._id,
        name: `${staff.profile?.firstName} ${staff.profile?.lastName}`,
        evaluations
      }
    });

  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching evaluations'
    });
  }
});

module.exports = router;