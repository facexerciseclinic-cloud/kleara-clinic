const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Bill = require('../models/Bill');
const Appointment = require('../models/Appointment');
const authPatient = require('../middleware/authPatient'); // We will create this middleware

// Utility to generate token
const generateToken = (id) => {
  return jwt.sign({ id, type: 'patient' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST api/portal/login
// @desc    Authenticate patient & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { hn, password } = req.body;

  try {
    const patient = await Patient.findOne({ hn }).select('+password');

    if (patient && (await patient.matchPassword(password))) {
      res.json({
        _id: patient._id,
        name: patient.name,
        hn: patient.hn,
        token: generateToken(patient._id),
      });
    } else {
      res.status(401).json({ message: 'HN หรือรหัสผ่านไม่ถูกต้อง' });
    }
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/portal/register
// @desc    Register a patient for portal access
// @access  Private (Staff/Admin can do this)
const { auth } = require('../middleware/auth');
router.post('/register', auth, async (req, res) => {
    const { patientId, password } = req.body;
    try {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ป่วย' });
        }
        patient.password = password;
        await patient.save();
        res.json({ message: 'เปิดใช้งาน Portal ສຳเร็จ' });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});


// Below are protected routes for logged-in patients

// @route   GET api/portal/me
// @desc    Get current patient profile
// @access  Private (Patient)
router.get('/me', authPatient, async (req, res) => {
  try {
    // req.patient is attached from the authPatient middleware
    const patient = await Patient.findById(req.patient.id).select('-password');
    res.json(patient);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/portal/my-bills
// @desc    Get patient's billing history
// @access  Private (Patient)
router.get('/my-bills', authPatient, async (req, res) => {
    try {
        const bills = await Bill.find({ patient: req.patient.id }).sort({ date: -1 });
        res.json(bills);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/portal/my-appointments
// @desc    Get patient's appointment history
// @access  Private (Patient)
router.get('/my-appointments', authPatient, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.patient.id }).sort({ startTime: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});


module.exports = router;
