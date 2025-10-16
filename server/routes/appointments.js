const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { auth, checkPermission } = require('../middleware/auth');
const Joi = require('joi');

// Validation schema for appointment
const appointmentSchema = Joi.object({
  patient: Joi.string().required(),
  appointmentDate: Joi.date().required(),
  timeSlot: Joi.object({
    start: Joi.string().required(),
    end: Joi.string().required()
  }).required(),
  services: Joi.array().items(Joi.object({
    serviceId: Joi.string().optional(),
    serviceName: Joi.string().required(),
    estimatedDuration: Joi.number().optional(),
    price: Joi.number().optional()
  })).required(),
  assignedStaff: Joi.object({
    doctor: Joi.string().optional(),
    therapist: Joi.string().optional(),
    nurse: Joi.string().optional()
  }).optional(),
  resources: Joi.object({
    room: Joi.string().optional(),
    equipment: Joi.array().items(Joi.string()).optional()
  }).optional(),
  appointmentType: Joi.string().valid('consultation', 'treatment', 'follow-up', 'emergency').default('consultation'),
  priority: Joi.string().valid('normal', 'urgent', 'emergency').default('normal'),
  notes: Joi.string().optional(),
  specialInstructions: Joi.string().optional()
});

// @route   GET /api/appointments
// @desc    Get appointments with filters
// @access  Private
router.get('/', auth, checkPermission('appointments', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      date,
      startDate,
      endDate,
      status,
      doctor,
      patient,
      view = 'day'
    } = req.query;

    // Build query
    let query = {};

    // Date filtering
    if (date) {
      const selectedDate = new Date(date);
      query.appointmentDate = {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      };
    } else if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current week for week view, current month for month view
      const today = new Date();
      if (view === 'week') {
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        query.appointmentDate = {
          $gte: startOfWeek,
          $lte: endOfWeek
        };
      } else if (view === 'month') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        query.appointmentDate = {
          $gte: startOfMonth,
          $lte: endOfMonth
        };
      }
    }

    if (status) {
      query.status = status;
    }

    if (doctor) {
      query['assignedStaff.doctor'] = doctor;
    }

    if (patient) {
      query.patient = patient;
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('patient', 'hn profile.firstName profile.lastName profile.contact.phone')
      .populate('assignedStaff.doctor', 'profile.firstName profile.lastName')
      .populate('assignedStaff.therapist', 'profile.firstName profile.lastName')
      .populate('assignedStaff.nurse', 'profile.firstName profile.lastName')
      .sort({ appointmentDate: 1, 'timeSlot.start': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', auth, checkPermission('appointments', 'read'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient')
      .populate('assignedStaff.doctor assignedStaff.therapist assignedStaff.nurse')
      .populate('bookedBy', 'profile.firstName profile.lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: {
        appointment
      }
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment'
    });
  }
});

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private
router.post('/', auth, checkPermission('appointments', 'write'), async (req, res) => {
  try {
    // Validate input
    const { error } = appointmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if patient exists
    const patient = await Patient.findById(req.body.patient);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check for time conflicts
    const conflictingAppointment = await Appointment.findOne({
      appointmentDate: req.body.appointmentDate,
      status: { $nin: ['cancelled', 'no-show'] },
      $or: [
        {
          'timeSlot.start': { $lt: req.body.timeSlot.end },
          'timeSlot.end': { $gt: req.body.timeSlot.start }
        }
      ],
      $or: [
        { 'assignedStaff.doctor': req.body.assignedStaff?.doctor },
        { 'resources.room': req.body.resources?.room }
      ].filter(condition => Object.values(condition)[0])
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Time slot conflicts with existing appointment'
      });
    }

    const appointment = new Appointment({
      ...req.body,
      bookedBy: req.user._id,
      bookingChannel: 'walk-in'
    });

    await appointment.save();

    // Update patient last visit
    patient.lastVisit = new Date();
    patient.totalVisits += 1;
    await patient.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'hn profile.firstName profile.lastName')
      .populate('assignedStaff.doctor assignedStaff.therapist assignedStaff.nurse');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        appointment: populatedAppointment
      }
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating appointment'
    });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', auth, checkPermission('appointments', 'write'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be modified
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed appointment'
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient assignedStaff.doctor assignedStaff.therapist assignedStaff.nurse');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        appointment: updatedAppointment
      }
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment'
    });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.put('/:id/status', auth, checkPermission('appointments', 'write'), async (req, res) => {
  try {
    const { status, reason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update status-specific fields
    const updateData = { status };

    switch (status) {
      case 'checked-in':
        updateData.checkedInAt = new Date();
        updateData.checkedInBy = req.user._id;
        break;
      case 'in-progress':
        updateData.actualStartTime = new Date();
        break;
      case 'completed':
        updateData.actualEndTime = new Date();
        break;
      case 'cancelled':
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = req.user._id;
        updateData.cancellationReason = reason;
        break;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('patient assignedStaff.doctor');

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: {
        appointment: updatedAppointment
      }
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment status'
    });
  }
});

// @route   GET /api/appointments/availability/check
// @desc    Check appointment availability
// @access  Private
router.get('/availability/check', auth, checkPermission('appointments', 'read'), async (req, res) => {
  try {
    const { date, timeSlot, doctor, room } = req.query;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Date and time slot are required'
      });
    }

    const [startTime, endTime] = timeSlot.split('-');

    let query = {
      appointmentDate: new Date(date),
      status: { $nin: ['cancelled', 'no-show'] },
      'timeSlot.start': { $lt: endTime },
      'timeSlot.end': { $gt: startTime }
    };

    if (doctor) {
      query['assignedStaff.doctor'] = doctor;
    }

    if (room) {
      query['resources.room'] = room;
    }

    const conflictingAppointments = await Appointment.find(query);

    res.json({
      success: true,
      data: {
        available: conflictingAppointments.length === 0,
        conflicts: conflictingAppointments.length,
        conflictingAppointments
      }
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking availability'
    });
  }
});

// @route   GET /api/appointments/availability/slots
// @desc    Get available time slots for a specific date and doctor
// @access  Public (for online booking)
router.get('/availability/slots', async (req, res) => {
  try {
    const { date, doctorId, duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Define clinic hours (9 AM - 8 PM)
    const clinicStartHour = 9;
    const clinicEndHour = 20;
    const slotDuration = parseInt(duration); // minutes

    // Get existing appointments for the date
    let query = {
      appointmentDate: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      },
      status: { $nin: ['cancelled', 'no-show'] }
    };

    if (doctorId) {
      query['assignedStaff.doctor'] = doctorId;
    }

    const existingAppointments = await Appointment.find(query);

    // Generate all possible time slots
    const slots = [];
    for (let hour = clinicStartHour; hour < clinicEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const endHour = Math.floor((hour * 60 + minute + slotDuration) / 60);
        const endMinute = (hour * 60 + minute + slotDuration) % 60;
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

        // Check if slot is available
        const isBooked = existingAppointments.some(apt => {
          return (
            (startTime >= apt.timeSlot.start && startTime < apt.timeSlot.end) ||
            (endTime > apt.timeSlot.start && endTime <= apt.timeSlot.end) ||
            (startTime <= apt.timeSlot.start && endTime >= apt.timeSlot.end)
          );
        });

        slots.push({
          startTime,
          endTime,
          available: !isBooked
        });
      }
    }

    res.json({
      success: true,
      data: {
        date,
        slots,
        availableCount: slots.filter(s => s.available).length,
        totalSlots: slots.length
      }
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots'
    });
  }
});

// @route   POST /api/appointments/online-booking
// @desc    Create appointment via online booking (public)
// @access  Public
router.post('/online-booking', async (req, res) => {
  try {
    const { 
      patientInfo, 
      appointmentDate, 
      timeSlot, 
      services, 
      notes 
    } = req.body;

    // Validate required fields
    if (!patientInfo || !appointmentDate || !timeSlot || !services) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if patient exists or create new
    let patient = await Patient.findOne({ 
      $or: [
        { phoneNumber: patientInfo.phoneNumber },
        { email: patientInfo.email }
      ]
    });

    if (!patient) {
      patient = new Patient({
        firstName: patientInfo.firstName,
        lastName: patientInfo.lastName,
        phoneNumber: patientInfo.phoneNumber,
        email: patientInfo.email,
        dateOfBirth: patientInfo.dateOfBirth,
        gender: patientInfo.gender
      });
      await patient.save();
    }

    // Check availability
    const [startTime, endTime] = timeSlot.split('-');
    const conflictingAppointments = await Appointment.find({
      appointmentDate: new Date(appointmentDate),
      status: { $nin: ['cancelled', 'no-show'] },
      'timeSlot.start': { $lt: endTime },
      'timeSlot.end': { $gt: startTime }
    });

    if (conflictingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is not available'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patient._id,
      appointmentDate: new Date(appointmentDate),
      timeSlot: {
        start: startTime,
        end: endTime
      },
      services,
      bookingChannel: 'online',
      status: 'pending',
      notes
    });

    await appointment.save();

    // Send confirmation (SMS + LINE if available)
    try {
      // TODO: Send confirmation via SMS/LINE
      console.log('Sending booking confirmation to:', patient.phoneNumber);
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        patient: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          phoneNumber: patient.phoneNumber
        }
      }
    });

  } catch (error) {
    console.error('Online booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
});

// @route   POST /api/appointments/:id/send-reminder
// @desc    Send appointment reminder via SMS/LINE
// @access  Private
router.post('/:id/send-reminder', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { channels = ['sms'] } = req.body; // ['sms', 'line', 'email']

    const results = {
      sms: { sent: false, error: null },
      line: { sent: false, error: null },
      email: { sent: false, error: null }
    };

    const reminderData = {
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      appointmentDate: appointment.appointmentDate.toLocaleDateString('th-TH'),
      appointmentTime: appointment.timeSlot.start,
      service: appointment.services.map(s => s.serviceName).join(', ')
    };

    // Send via requested channels
    if (channels.includes('sms') && appointment.patient.phoneNumber) {
      try {
        const axios = require('axios');
        await axios.post(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/sms/send-reminder`, {
          phoneNumber: appointment.patient.phoneNumber,
          ...reminderData
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        
        results.sms.sent = true;
        appointment.reminders.push({
          type: 'sms',
          sentAt: new Date(),
          status: 'sent'
        });
      } catch (error) {
        results.sms.error = error.message;
      }
    }

    if (channels.includes('line') && appointment.patient.lineUserId) {
      try {
        const axios = require('axios');
        await axios.post(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/line/appointment-reminder`, {
          lineUserId: appointment.patient.lineUserId,
          ...reminderData
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        
        results.line.sent = true;
        appointment.reminders.push({
          type: 'line',
          sentAt: new Date(),
          status: 'sent'
        });
      } catch (error) {
        results.line.error = error.message;
      }
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Reminder sent',
      data: results
    });

  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: error.message
    });
  }
});

// @route   GET /api/appointments/calendar/:year/:month
// @desc    Get calendar view for a specific month
// @access  Private
router.get('/calendar/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('patient', 'firstName lastName phoneNumber')
    .populate('assignedStaff.doctor', 'firstName lastName')
    .sort({ appointmentDate: 1, 'timeSlot.start': 1 });

    // Group by date
    const calendarData = {};
    appointments.forEach(apt => {
      const dateKey = apt.appointmentDate.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push({
        id: apt._id,
        appointmentNumber: apt.appointmentNumber,
        time: apt.timeSlot.start,
        patient: apt.patient,
        services: apt.services.map(s => s.serviceName),
        status: apt.status,
        doctor: apt.assignedStaff?.doctor
      });
    });

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        appointments: calendarData,
        totalAppointments: appointments.length
      }
    });

  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar data'
    });
  }
});

// @route   GET /api/appointments/recurring/templates
// @desc    Get recurring appointment templates
// @access  Private
router.get('/recurring/templates', auth, async (req, res) => {
  try {
    // This would typically fetch from a RecurringTemplate model
    // For now, return demo data
    const templates = [
      {
        id: 1,
        name: 'Weekly Botox Treatment',
        frequency: 'weekly',
        duration: 60,
        services: ['Botox Injection']
      },
      {
        id: 2,
        name: 'Monthly Facial',
        frequency: 'monthly',
        duration: 90,
        services: ['Deep Cleansing Facial']
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

// @route   POST /api/appointments/recurring
// @desc    Create recurring appointments
// @access  Private
router.post('/recurring', auth, async (req, res) => {
  try {
    const {
      patient,
      startDate,
      endDate,
      timeSlot,
      services,
      frequency, // 'daily', 'weekly', 'monthly'
      assignedStaff,
      notes
    } = req.body;

    if (!patient || !startDate || !endDate || !timeSlot || !frequency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const appointments = [];
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      // Check availability
      const [start, end] = timeSlot.split('-');
      const conflicts = await Appointment.find({
        appointmentDate: currentDate,
        status: { $nin: ['cancelled', 'no-show'] },
        'timeSlot.start': { $lt: end },
        'timeSlot.end': { $gt: start }
      });

      if (conflicts.length === 0) {
        const appointment = new Appointment({
          patient,
          appointmentDate: new Date(currentDate),
          timeSlot: {
            start,
            end
          },
          services,
          assignedStaff,
          notes,
          bookingChannel: 'phone'
        });

        await appointment.save();
        appointments.push(appointment);
      }

      // Increment date based on frequency
      switch (frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${appointments.length} recurring appointments`,
      data: appointments
    });

  } catch (error) {
    console.error('Create recurring appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recurring appointments',
      error: error.message
    });
  }
});

module.exports = router;