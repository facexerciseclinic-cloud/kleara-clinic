const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    titleTh: { type: String }, // คำนำหน้าชื่อ เช่น นาย, นาง, นางสาว
    titleEn: { type: String }, // Mr., Mrs., Ms., Dr.
    phone: { type: String, required: true },
    lineId: { type: String },
    profileImage: { type: String },
    dateOfBirth: { type: Date },
    address: {
      street: { type: String },
      district: { type: String },
      province: { type: String },
      postalCode: { type: String }
    }
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'doctor', 'nurse', 'receptionist', 'therapist'],
    required: true
  },
  permissions: [{
    module: { type: String, required: true },
    actions: [{ type: String }] // ['read', 'write', 'delete', 'admin']
  }],
  schedule: {
    workingDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
    workingHours: {
      start: { type: String }, // "09:00"
      end: { type: String }    // "18:00"
    },
    breakTime: {
      start: { type: String },
      end: { type: String }
    }
  },
  specializations: [{ type: String }], // สำหรับแพทย์
  commissionRate: { type: Number, default: 0 }, // อัตราค่าคอมมิชชั่น
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

userSchema.virtual('fullNameTh').get(function() {
  return `${this.profile.titleTh || ''}${this.profile.firstName} ${this.profile.lastName}`.trim();
});

userSchema.virtual('fullNameEn').get(function() {
  return `${this.profile.titleEn || ''}${this.profile.firstName} ${this.profile.lastName}`.trim();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);