const express = require('express');
const router = express.Router();
const Treatment = require('../models/Treatment');
const Patient = require('../models/Patient');
const Product = require('../models/Product');
const { auth, checkPermission } = require('../middleware/auth');

// @route   GET /api/treatments
// @desc    Get treatments with filters
// @access  Private
router.get('/', auth, checkPermission('treatments', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      patient,
      doctor,
      treatmentType,
      startDate,
      endDate,
      status
    } = req.query;

    let query = { isActive: true };

    if (patient) query.patient = patient;
    if (doctor) query['performedBy.doctor'] = doctor;
    if (treatmentType) query.treatmentType = treatmentType;
    if (status) query.status = status;

    if (startDate && endDate) {
      query.treatmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;

    const treatments = await Treatment.find(query)
      .populate('patient', 'hn profile.firstName profile.lastName')
      .populate('performedBy.doctor', 'profile.firstName profile.lastName')
      .populate('appointment', 'appointmentNumber appointmentDate')
      .sort({ treatmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Treatment.countDocuments(query);

    res.json({
      success: true,
      data: {
        treatments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get treatments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching treatments'
    });
  }
});

// @route   GET /api/treatments/:id
// @desc    Get single treatment
// @access  Private
router.get('/:id', auth, checkPermission('treatments', 'read'), async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id)
      .populate('patient')
      .populate('appointment')
      .populate('performedBy.doctor performedBy.assistants')
      .populate('productsUsed.productId');

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Treatment not found'
      });
    }

    res.json({
      success: true,
      data: {
        treatment
      }
    });

  } catch (error) {
    console.error('Get treatment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching treatment'
    });
  }
});

// @route   POST /api/treatments
// @desc    Create new treatment
// @access  Private
router.post('/', auth, checkPermission('treatments', 'write'), async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.patient) {
      return res.status(400).json({
        success: false,
        message: 'Patient is required'
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

    // Map treatmentType to enum or default to 'other'
    const treatmentTypeMap = {
      'consultation': 'consultation',
      'botox': 'botox',
      'filler': 'filler',
      'laser': 'laser',
      'facial': 'facial',
      'body': 'body_treatment',
      'body_treatment': 'body_treatment',
      'surgery': 'surgery'
    };
    
    // Try to map, default to 'other' if not found
    const providedType = req.body.treatmentType?.toLowerCase() || '';
    let mappedType = 'other';
    
    for (const [key, value] of Object.entries(treatmentTypeMap)) {
      if (providedType.includes(key)) {
        mappedType = value;
        break;
      }
    }
    
    req.body.treatmentType = mappedType;

    // Create procedure from service if provided
    if (req.body.service && req.body.treatmentType) {
      const serviceName = req.body.treatmentTypeName || req.body.treatmentType;
      req.body.procedures = [{
        procedureName: serviceName,
        cost: req.body.charges?.total || 0
      }];
    }

    // Set billing information
    if (!req.body.billing && req.body.charges?.total) {
      req.body.billing = {
        totalCost: req.body.charges.total,
        procedureFee: req.body.charges.total,
        finalAmount: req.body.charges.total,
        paymentStatus: 'pending'
      };
    } else if (!req.body.billing) {
      req.body.billing = {
        totalCost: 0,
        finalAmount: 0,
        paymentStatus: 'pending'
      };
    }

    // Set default status
    if (!req.body.status) {
      req.body.status = 'in-progress';
    } else if (req.body.status === 'scheduled') {
      // Map 'scheduled' to 'in-progress'
      req.body.status = 'in-progress';
    }

    // Set default doctor if not provided (skip for demo users)
    if (!req.body.performedBy?.doctor) {
      // Check if user ID is valid ObjectId (not demo user)
      if (String(req.user._id).match(/^[0-9a-fA-F]{24}$/)) {
        req.body.performedBy = {
          ...req.body.performedBy,
          doctor: req.user._id
        };
      } else {
        // For demo users, don't set doctor
        req.body.performedBy = {
          ...req.body.performedBy
        };
      }
    }

    // Set created by (skip for demo users)
    if (String(req.user._id).match(/^[0-9a-fA-F]{24}$/)) {
      req.body.createdBy = req.user._id;
    }

    // Don't require treatmentId, let pre-save hook generate it
    delete req.body.treatmentId;

    const treatment = new Treatment(req.body);
    await treatment.save();

    // Update product stock if products were used
    if (req.body.productsUsed && req.body.productsUsed.length > 0) {
      for (const productUsed of req.body.productsUsed) {
        await updateProductStock(productUsed.productId, productUsed.quantityUsed);
      }
    }

    const populatedTreatment = await Treatment.findById(treatment._id)
      .populate('patient', 'hn profile.firstName profile.lastName')
      .populate('performedBy.doctor', 'profile.firstName profile.lastName');

    res.status(201).json({
      success: true,
      message: 'Treatment created successfully',
      data: {
        treatment: populatedTreatment
      }
    });

  } catch (error) {
    console.error('Create treatment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating treatment'
    });
  }
});

// @route   PUT /api/treatments/:id
// @desc    Update treatment
// @access  Private
router.put('/:id', auth, checkPermission('treatments', 'write'), async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id);

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Treatment not found'
      });
    }

    // Check if user can edit this treatment
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        treatment.performedBy.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own treatments'
      });
    }

    req.body.updatedBy = req.user._id;

    const updatedTreatment = await Treatment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient performedBy.doctor');

    res.json({
      success: true,
      message: 'Treatment updated successfully',
      data: {
        treatment: updatedTreatment
      }
    });

  } catch (error) {
    console.error('Update treatment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating treatment'
    });
  }
});

// @route   POST /api/treatments/:id/photos
// @desc    Add photos to treatment
// @access  Private
router.post('/:id/photos', auth, checkPermission('treatments', 'write'), async (req, res) => {
  try {
    const { type, photos } = req.body; // type: 'before', 'during', 'after'

    if (!['before', 'during', 'after'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo type. Must be before, during, or after'
      });
    }

    const treatment = await Treatment.findById(req.params.id);

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Treatment not found'
      });
    }

    // Add photos to the specified type
    if (!treatment.photos[type]) {
      treatment.photos[type] = [];
    }

    treatment.photos[type].push(...photos);
    await treatment.save();

    res.json({
      success: true,
      message: 'Photos added successfully',
      data: {
        treatment
      }
    });

  } catch (error) {
    console.error('Add photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding photos'
    });
  }
});

// @route   PUT /api/treatments/:id/status
// @desc    Update treatment status
// @access  Private
router.put('/:id/status', auth, checkPermission('treatments', 'write'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const treatment = await Treatment.findById(req.params.id);

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Treatment not found'
      });
    }

    treatment.status = status;
    treatment.updatedBy = req.user._id;

    if (status === 'completed') {
      // Auto-calculate billing if not already set
      if (!treatment.billing.totalCost) {
        const totalProceduresCost = treatment.procedures.reduce((sum, proc) => sum + (proc.cost || 0), 0);
        const totalProductsCost = treatment.productsUsed.reduce((sum, prod) => sum + (prod.cost || 0), 0);
        
        treatment.billing.totalCost = totalProceduresCost + totalProductsCost;
        treatment.billing.procedureFee = totalProceduresCost;
        treatment.billing.materialsCost = totalProductsCost;
        treatment.billing.finalAmount = treatment.billing.totalCost - (treatment.billing.discount || 0);
      }
    }

    await treatment.save();

    res.json({
      success: true,
      message: `Treatment ${status} successfully`,
      data: {
        treatment
      }
    });

  } catch (error) {
    console.error('Update treatment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating treatment status'
    });
  }
});

// @route   GET /api/treatments/patient/:patientId
// @desc    Get patient's treatment history
// @access  Private
router.get('/patient/:patientId', auth, checkPermission('treatments', 'read'), async (req, res) => {
  try {
    const treatments = await Treatment.find({ 
      patient: req.params.patientId,
      isActive: true 
    })
      .populate('performedBy.doctor', 'profile.firstName profile.lastName')
      .sort({ treatmentDate: -1 });

    res.json({
      success: true,
      data: {
        treatments
      }
    });

  } catch (error) {
    console.error('Get patient treatments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient treatments'
    });
  }
});

// Helper function to update product stock
async function updateProductStock(productId, quantityUsed) {
  try {
    const product = await Product.findById(productId);
    if (product) {
      // Find the first available lot (FEFO - First Expired, First Out)
      const availableLot = product.lots
        .filter(lot => lot.status === 'active' && lot.remainingQuantity > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0];

      if (availableLot && availableLot.remainingQuantity >= quantityUsed) {
        availableLot.remainingQuantity -= quantityUsed;
        product.inventory.currentStock -= quantityUsed;
        product.updateUsage(quantityUsed);
        await product.save();
      }
    }
  } catch (error) {
    console.error('Error updating product stock:', error);
  }
}

module.exports = router;