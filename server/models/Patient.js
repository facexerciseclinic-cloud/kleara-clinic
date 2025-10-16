const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
  hn: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  profile: {
    titleTh: { type: String }, // คำนำหน้าชื่อ
    titleEn: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    nickname: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    dateOfBirth: { type: Date, required: true },
    idCard: { type: String }, // เลขบัตรประชาชน
    nationality: { type: String, default: 'Thai' },
    religion: { type: String },
    occupation: { type: String },
    profileImage: { type: String },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, lowercase: true, trim: true },
      lineId: { type: String },
      emergencyContact: {
        name: { type: String },
        relationship: { type: String },
        phone: { type: String }
      }
    },
    address: {
      current: {
        houseNumber: { type: String },
        street: { type: String },
        subDistrict: { type: String },
        district: { type: String },
        province: { type: String },
        postalCode: { type: String }
      },
      permanent: {
        houseNumber: { type: String },
        street: { type: String },
        subDistrict: { type: String },
        district: { type: String },
        province: { type: String },
        postalCode: { type: String }
      },
      sameAsCurrent: { type: Boolean, default: true }
    }
  },
  medicalInfo: {
    allergies: {
      drugs: [{ type: String }],
      food: [{ type: String }],
      other: [{ type: String }],
      notes: { type: String }
    },
    chronicDiseases: [{ type: String }],
    currentMedications: [{
      name: { type: String },
      dosage: { type: String },
      frequency: { type: String },
      notes: { type: String }
    }],
    previousSurgeries: [{
      procedure: { type: String },
      date: { type: Date },
      hospital: { type: String },
      notes: { type: String }
    }],
    familyHistory: { type: String },
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }
  },
  tags: [{ type: String }], // VIP, Blacklist, แพ้ส่วนผสม A, สนใจโปรแกรม B
  membershipInfo: {
    level: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
    joinDate: { type: Date, default: Date.now },
    totalSpent: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    referralCode: { type: String, unique: true }
  },
  pdpaConsent: {
    dataProcessing: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    thirdPartySharing: { type: Boolean, default: false },
    consentDate: { type: Date },
    ipAddress: { type: String },
    consentVersion: { type: String, default: '1.0' }
  },
  preferences: {
    language: { type: String, enum: ['th', 'en'], default: 'th' },
    notifications: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      line: { type: Boolean, default: true }
    },
    appointmentReminder: { type: Boolean, default: true }
  },
  notes: { type: String }, // หมายเหตุทั่วไป
  isActive: { type: Boolean, default: true },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastVisit: { type: Date },
  totalVisits: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  password: {
    type: String,
    // required: true, // Not all patients may have portal access initially
    select: false, // Don't return password by default
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
  },
}, {
  timestamps: true
});

// Calculate age
patientSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Get full name
patientSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

patientSchema.virtual('fullNameTh').get(function() {
  return `${this.profile.titleTh || ''}${this.profile.firstName} ${this.profile.lastName}`.trim();
});

// Generate HN automatically
patientSchema.pre('save', async function(next) {
  if (!this.hn) {
    const count = await this.constructor.countDocuments();
    this.hn = `HN${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Generate referral code
patientSchema.pre('save', function(next) {
  if (!this.membershipInfo.referralCode) {
    this.membershipInfo.referralCode = `KC${this.hn.substring(2)}`;
  }
  next();
});

// Hash password before saving
patientSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
patientSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};
// Index for search
patientSchema.index({ 
  'profile.firstName': 'text', 
  'profile.lastName': 'text', 
  'profile.nickname': 'text',
  'hn': 'text',
  'profile.contact.phone': 'text',
  'profile.contact.email': 'text'
});

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Patient', patientSchema);