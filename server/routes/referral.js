const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const Patient = require('../models/Patient');
const Setting = require('../models/Setting');
const { auth } = require('../middleware/auth');

// Generate a unique referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @route   GET api/referral/my-code/:patientId
// @desc    Get or generate referral code for a patient
// @access  Private
router.get('/my-code/:patientId', auth, async (req, res) => {
  try {
    let patient = await Patient.findById(req.params.patientId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // If patient doesn't have a referral code, generate one
    if (!patient.membershipInfo.referralCode) {
      let code;
      let isUnique = false;
      
      // Keep generating until we get a unique code
      while (!isUnique) {
        code = generateReferralCode();
        const existing = await Patient.findOne({ 'membershipInfo.referralCode': code });
        if (!existing) {
          isUnique = true;
        }
      }
      
      patient.membershipInfo.referralCode = code;
      await patient.save();
    }

    res.json({
      referralCode: patient.membershipInfo.referralCode,
      referralLink: `${process.env.CLIENT_URL}/register?ref=${patient.membershipInfo.referralCode}`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/referral/validate
// @desc    Validate a referral code
// @access  Public
router.post('/validate', async (req, res) => {
  const { referralCode } = req.body;

  try {
    const referrer = await Patient.findOne({ 'membershipInfo.referralCode': referralCode.toUpperCase() });
    
    if (!referrer) {
      return res.status(404).json({ valid: false, message: 'รหัสแนะนำไม่ถูกต้อง' });
    }

    res.json({
      valid: true,
      referrerName: `${referrer.profile.firstName} ${referrer.profile.lastName}`,
      message: 'รหัสแนะนำถูกต้อง'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/referral/apply
// @desc    Apply referral code when creating a new patient
// @access  Private
router.post('/apply', auth, async (req, res) => {
  const { referralCode, newPatientId } = req.body;

  try {
    const referrer = await Patient.findOne({ 'membershipInfo.referralCode': referralCode.toUpperCase() });
    
    if (!referrer) {
      return res.status(404).json({ message: 'รหัสแนะนำไม่ถูกต้อง' });
    }

    const newPatient = await Patient.findById(newPatientId);
    if (!newPatient) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ป่วยใหม่' });
    }

    // Check if already referred
    if (newPatient.referredBy) {
      return res.status(400).json({ message: 'ผู้ป่วยนี้ถูกแนะนำแล้ว' });
    }

    // Get referral settings
    const referrerRewardSetting = await Setting.findOne({ key: 'referral_referrer_reward' });
    const referredRewardSetting = await Setting.findOne({ key: 'referral_referred_reward' });

    const referrerPoints = referrerRewardSetting ? referrerRewardSetting.value : 500;
    const referredPoints = referredRewardSetting ? referredRewardSetting.value : 200;

    // Create referral record
    const referral = new Referral({
      referrer: referrer._id,
      referred: newPatient._id,
      referralCode: referralCode.toUpperCase(),
      status: 'completed',
      referrerReward: {
        type: 'points',
        value: referrerPoints,
        description: `รับ ${referrerPoints} แต้มจากการแนะนำเพื่อน`
      },
      referredReward: {
        type: 'points',
        value: referredPoints,
        description: `รับ ${referredPoints} แต้มจากการสมัครผ่านรหัสแนะนำ`
      },
      completedAt: new Date(),
      rewardGiven: true,
    });

    await referral.save();

    // Update patients
    newPatient.referredBy = referrer._id;
    newPatient.loyaltyPoints = (newPatient.loyaltyPoints || 0) + referredPoints;
    await newPatient.save();

    referrer.loyaltyPoints = (referrer.loyaltyPoints || 0) + referrerPoints;
    await referrer.save();

    res.json({
      message: 'ใช้รหัสแนะนำสำเร็จ',
      referrerReward: referrerPoints,
      referredReward: referredPoints,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/referral/my-referrals/:patientId
// @desc    Get all referrals made by a patient
// @access  Private
router.get('/my-referrals/:patientId', auth, async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.params.patientId })
      .populate('referred', 'profile.firstName profile.lastName hn')
      .sort({ createdAt: -1 });

    const summary = {
      total: referrals.length,
      completed: referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
      pending: referrals.filter(r => r.status === 'pending').length,
      totalRewards: referrals
        .filter(r => r.rewardGiven)
        .reduce((sum, r) => sum + (r.referrerReward?.value || 0), 0),
    };

    res.json({
      referrals,
      summary,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/referral/stats
// @desc    Get overall referral statistics (Admin)
// @access  Private (Admin)
router.get('/stats', auth, async (req, res) => {
  try {
    const totalReferrals = await Referral.countDocuments();
    const completedReferrals = await Referral.countDocuments({ 
      status: { $in: ['completed', 'rewarded'] } 
    });
    const pendingReferrals = await Referral.countDocuments({ status: 'pending' });

    // Top referrers
    const topReferrers = await Referral.aggregate([
      { $match: { status: { $in: ['completed', 'rewarded'] } } },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: '_id',
          as: 'patient'
        }
      },
      { $unwind: '$patient' },
      {
        $project: {
          name: { 
            $concat: ['$patient.profile.firstName', ' ', '$patient.profile.lastName'] 
          },
          hn: '$patient.hn',
          count: 1
        }
      }
    ]);

    res.json({
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      topReferrers,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
