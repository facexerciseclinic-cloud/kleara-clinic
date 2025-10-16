const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { auth, checkPermission } = require('../middleware/auth');
const Joi = require('joi');

// Validation schema for patient
const patientSchema = Joi.object({
  profile: Joi.object({
    titleTh: Joi.string().optional(),
    titleEn: Joi.string().optional(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    nickname: Joi.string().allow('').optional(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    dateOfBirth: Joi.date().required(),
    idCard: Joi.string().optional(),
    nationality: Joi.string().default('Thai'),
    occupation: Joi.string().allow('').optional(),
    contact: Joi.object({
      phone: Joi.string().required(),
      email: Joi.string().email().allow('').optional(),
      lineId: Joi.string().optional(),
      emergencyContact: Joi.object({
        name: Joi.string().optional(),
        relationship: Joi.string().optional(),
        phone: Joi.string().optional()
      }).optional()
    }).required(),
    address: Joi.object({
      current: Joi.object({
        houseNumber: Joi.string().optional(),
        street: Joi.string().allow('').optional(),
        subDistrict: Joi.string().optional(),
        district: Joi.string().optional(),
        province: Joi.string().optional(),
        postalCode: Joi.string().optional()
      }).optional(),
      permanent: Joi.object({
        houseNumber: Joi.string().optional(),
        street: Joi.string().allow('').optional(),
        subDistrict: Joi.string().optional(),
        district: Joi.string().optional(),
        province: Joi.string().optional(),
        postalCode: Joi.string().optional()
      }).optional()
    }).optional()
  }).required(),
  membershipInfo: Joi.object({
    level: Joi.string().valid('Silver', 'Gold', 'Platinum', 'Diamond').default('Silver'),
    joinDate: Joi.date().optional(),
    expiryDate: Joi.date().optional()
  }).optional(),
  medicalInfo: Joi.object({
    allergies: Joi.object({
      drugs: Joi.array().items(Joi.string()).default([]),
      food: Joi.array().items(Joi.string()).default([]),
      other: Joi.array().items(Joi.string()).default([]),
      notes: Joi.string().optional()
    }).optional(),
    chronicDiseases: Joi.array().items(Joi.string()).default([]),
    currentMedications: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      dosage: Joi.string().optional(),
      frequency: Joi.string().optional(),
      notes: Joi.string().optional()
    })).default([])
  }).optional(),
  pdpaConsent: Joi.object({
    dataProcessing: Joi.boolean().required(),
    marketing: Joi.boolean().default(false),
    thirdPartySharing: Joi.boolean().default(false)
  }).required(),
  referredBy: Joi.string().optional()
});

// @route   GET /api/patients
// @desc    Get all patients with pagination and search
// @access  Private
router.get('/', auth, checkPermission('patients', 'read'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const membershipLevel = req.query.membershipLevel;

    // Build search query
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.nickname': { $regex: search, $options: 'i' } },
        { hn: { $regex: search, $options: 'i' } },
        { 'profile.contact.phone': { $regex: search, $options: 'i' } },
        { 'profile.contact.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (membershipLevel) {
      query['membershipInfo.level'] = membershipLevel;
    }

    const skip = (page - 1) * limit;

    const patients = await Patient.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-medicalInfo.familyHistory -notes'); // Exclude sensitive info in list view

    const total = await Patient.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patients'
    });
  }
});

// @route   GET /api/patients/:id
// @desc    Get single patient by ID
// @access  Private
router.get('/:id', auth, checkPermission('patients', 'read'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient'
    });
  }
});

// @route   GET /api/patients/hn/:hn
// @desc    Get patient by HN
// @access  Private
router.get('/hn/:hn', auth, checkPermission('patients', 'read'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ hn: req.params.hn.toUpperCase() });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Get patient by HN error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient'
    });
  }
});

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private
router.post('/', auth, checkPermission('patients', 'write'), async (req, res) => {
  try {
    // Validate input
    const { error } = patientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Add PDPA consent metadata
    req.body.pdpaConsent.consentDate = new Date();
    req.body.pdpaConsent.ipAddress = req.ip;

    // Set registration info
    req.body.registeredBy = req.user._id;

    const patient = new Patient(req.body);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Create patient error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this information already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating patient'
    });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private
router.put('/:id', auth, checkPermission('patients', 'write'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Prevent updating certain fields
    const restrictedFields = ['hn', 'createdAt', 'registeredBy'];
    restrictedFields.forEach(field => delete req.body[field]);

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        patient: updatedPatient
      }
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating patient'
    });
  }
});

// @route   POST /api/patients/:id/tags
// @desc    Add tags to patient
// @access  Private
router.post('/:id/tags', auth, checkPermission('patients', 'write'), async (req, res) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array'
      });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Tags added successfully',
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Add tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding tags'
    });
  }
});

// @route   DELETE /api/patients/:id/tags
// @desc    Remove tags from patient
// @access  Private
router.delete('/:id/tags', auth, checkPermission('patients', 'write'), async (req, res) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array'
      });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $pull: { tags: { $in: tags } } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Tags removed successfully',
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Remove tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing tags'
    });
  }
});

// @route   PUT /api/patients/:id/loyalty-points
// @desc    Update patient loyalty points
// @access  Private
router.put('/:id/loyalty-points', auth, checkPermission('patients', 'write'), async (req, res) => {
  try {
    const { points, action } = req.body; // action: 'add' or 'redeem'

    if (!points || !action) {
      return res.status(400).json({
        success: false,
        message: 'Points and action are required'
      });
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (action === 'add') {
      patient.membershipInfo.loyaltyPoints += points;
    } else if (action === 'redeem') {
      if (patient.membershipInfo.loyaltyPoints < points) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient loyalty points'
        });
      }
      patient.membershipInfo.loyaltyPoints -= points;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "add" or "redeem"'
      });
    }

    await patient.save();

    res.json({
      success: true,
      message: `Loyalty points ${action === 'add' ? 'added' : 'redeemed'} successfully`,
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Update loyalty points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating loyalty points'
    });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Soft delete patient (deactivate)
// @access  Private
router.delete('/:id', auth, checkPermission('patients', 'delete'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient deactivated successfully'
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting patient'
    });
  }
});

module.exports = router;