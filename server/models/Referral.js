const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rewarded'],
    default: 'pending',
  },
  rewardGiven: {
    type: Boolean,
    default: false,
  },
  referrerReward: {
    type: {
      type: String,
      enum: ['points', 'discount', 'voucher'],
    },
    value: Number,
    description: String,
  },
  referredReward: {
    type: {
      type: String,
      enum: ['points', 'discount', 'voucher'],
    },
    value: Number,
    description: String,
  },
  completedAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

// Index for efficient queries
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referred: 1 });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
