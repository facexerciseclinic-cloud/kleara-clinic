const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');

// @route   GET api/loyalty/points/:patientId
// @desc    Get loyalty points for a patient
// @access  Private
router.get('/points/:patientId', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId).select('loyaltyPoints');
    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }
    res.json({ loyaltyPoints: patient.loyaltyPoints });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/loyalty/points
// @desc    Add or subtract loyalty points for a patient
// @access  Private
router.post('/points', auth, async (req, res) => {
  const { patientId, points } = req.body;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    patient.loyaltyPoints = (patient.loyaltyPoints || 0) + points;

    // Ensure points don't go below zero
    if (patient.loyaltyPoints < 0) {
      patient.loyaltyPoints = 0;
    }

    await patient.save();
    res.json({ loyaltyPoints: patient.loyaltyPoints });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
