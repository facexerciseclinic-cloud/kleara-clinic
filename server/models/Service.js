const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    th: { type: String, required: true },
    en: { type: String }
  },
  description: {
    th: { type: String },
    en: { type: String }
  },
  category: {
    type: String,
    required: true,
    enum: ['consultation', 'facial', 'injection', 'laser', 'body_treatment', 'surgery', 'package']
  },
  subCategory: { type: String },
  
  // Pricing
  pricing: {
    basePrice: { type: Number, required: true },
    memberPrice: { type: Number },
    vipPrice: { type: Number },
    doctorFee: { type: Number, default: 0 },
    facilityFee: { type: Number, default: 0 }
  },
  
  // Service details
  details: {
    duration: { type: Number, required: true }, // minutes
    preparationTime: { type: Number, default: 0 }, // minutes
    recoveryTime: { type: Number, default: 0 }, // minutes
    sessions: { type: Number, default: 1 }, // จำนวนครั้งที่แนะนำ
    intervalBetweenSessions: { type: Number }, // วันที่ควรห่างระหว่างครั้ง
    maxSessionsPerPackage: { type: Number }
  },
  
  // Requirements
  requirements: {
    requiredStaff: [{
      role: { type: String, enum: ['doctor', 'nurse', 'therapist'], required: true },
      quantity: { type: Number, default: 1 },
      specialization: { type: String }
    }],
    requiredEquipment: [{ type: String }],
    requiredRoom: { type: String },
    requiredProducts: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      productName: { type: String },
      quantityRequired: { type: Number },
      unit: { type: String }
    }]
  },
  
  // Medical information
  medicalInfo: {
    indications: [{ type: String }], // ข้อบ่งชี้
    contraindications: [{ type: String }], // ข้อห้าม
    precautions: [{ type: String }], // ข้อควรระวัง
    sideEffects: [{ type: String }], // ผลข้างเคียง
    preServiceInstructions: { type: String }, // คำแนะนำก่อนรับบริการ
    postServiceInstructions: { type: String }, // คำแนะนำหลังรับบริการ
    requiredTests: [{ type: String }] // การตรวจที่จำเป็น
  },
  
  // Package information (if this service is a package)
  packageInfo: {
    isPackage: { type: Boolean, default: false },
    includedServices: [{
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      serviceName: { type: String },
      quantity: { type: Number, default: 1 }
    }],
    validityPeriod: { type: Number }, // วัน
    transferable: { type: Boolean, default: false }, // โอนได้หรือไม่
    refundable: { type: Boolean, default: false } // คืนเงินได้หรือไม่
  },
  
  // Commission settings
  commission: {
    doctorCommissionRate: { type: Number, default: 0 }, // %
    therapistCommissionRate: { type: Number, default: 0 }, // %
    salesCommissionRate: { type: Number, default: 0 }, // %
    referralCommissionRate: { type: Number, default: 0 } // %
  },
  
  // Availability
  availability: {
    availableDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
    availableHours: {
      start: { type: String },
      end: { type: String }
    },
    maxBookingsPerDay: { type: Number },
    advanceBookingDays: { type: Number, default: 30 }, // จองล่วงหน้าได้กี่วัน
    cancellationPolicy: { type: String }
  },
  
  // Consent and documentation
  consentRequired: { type: Boolean, default: false },
  consentTemplate: { type: String },
  documentationRequired: [{ type: String }],
  
  // Images and media
  images: [{
    url: { type: String },
    type: { type: String, enum: ['before', 'after', 'procedure', 'equipment'] },
    description: { type: String }
  }],
  
  // SEO and marketing
  tags: [{ type: String }],
  popularityScore: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  
  // Status and settings
  isActive: { type: Boolean, default: true },
  isBookable: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: false }, // ต้องการอนุมัติก่อนจองหรือไม่
  displayOnWebsite: { type: Boolean, default: true },
  
  // Audit trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Calculate total duration including preparation and recovery
serviceSchema.virtual('totalDuration').get(function() {
  return this.details.duration + this.details.preparationTime + this.details.recoveryTime;
});

// Calculate profit margin
serviceSchema.virtual('profitMargin').get(function() {
  const totalCost = this.pricing.doctorFee + this.pricing.facilityFee;
  if (totalCost === 0) return 100;
  return ((this.pricing.basePrice - totalCost) / this.pricing.basePrice) * 100;
});

// Generate service code
serviceSchema.pre('save', async function(next) {
  if (!this.serviceCode) {
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const count = await this.constructor.countDocuments({ category: this.category });
    this.serviceCode = `${categoryCode}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update popularity score based on bookings
serviceSchema.methods.updatePopularity = function() {
  // Simple popularity calculation - can be made more sophisticated
  const daysSinceCreation = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
  this.popularityScore = this.totalBookings / Math.max(daysSinceCreation, 1) * 100;
};

// Index for search
serviceSchema.index({ 
  'name.th': 'text', 
  'name.en': 'text',
  'serviceCode': 'text',
  'tags': 'text',
  'category': 1,
  'subCategory': 1
});

serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Service', serviceSchema);