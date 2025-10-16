const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  packageNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['treatment-package', 'membership', 'course', 'voucher'],
    default: 'treatment-package'
  },
  
  // Pricing
  price: {
    original: { type: Number, required: true },
    selling: { type: Number, required: true },
    discount: { type: Number, default: 0 }
  },
  
  // Package contents
  services: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: { type: String, required: true },
    quantity: { type: Number, required: true }, // จำนวนครั้งที่ใช้ได้
    duration: { type: Number }, // นาที
    price: { type: Number }
  }],
  
  // Validity
  validity: {
    type: { type: String, enum: ['days', 'months', 'years', 'unlimited'], default: 'months' },
    value: { type: Number, default: 6 } // 6 months default
  },
  
  // Membership specific
  membershipTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  
  benefits: [{
    type: { type: String }, // 'discount', 'priority', 'free-service'
    description: { type: String },
    value: { type: String } // '10%', 'priority booking', etc.
  }],
  
  // Availability
  isActive: {
    type: Boolean,
    default: true
  },
  
  availableFrom: {
    type: Date
  },
  
  availableTo: {
    type: Date
  },
  
  maxPurchases: {
    type: Number // จำกัดจำนวนคนที่ซื้อได้
  },
  
  currentPurchases: {
    type: Number,
    default: 0
  },
  
  // Terms and conditions
  terms: {
    type: String
  },
  
  // Images
  images: [{
    url: { type: String },
    caption: { type: String }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate package number
packageSchema.pre('save', async function(next) {
  if (!this.packageNumber) {
    const count = await this.constructor.countDocuments();
    this.packageNumber = `PKG${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Calculate discount percentage
packageSchema.virtual('discountPercentage').get(function() {
  if (this.price.original > 0) {
    return Math.round(((this.price.original - this.price.selling) / this.price.original) * 100);
  }
  return 0;
});

// Check if package is available
packageSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  
  if (this.availableFrom && now < this.availableFrom) return false;
  if (this.availableTo && now > this.availableTo) return false;
  
  if (this.maxPurchases && this.currentPurchases >= this.maxPurchases) return false;
  
  return true;
});

packageSchema.set('toJSON', { virtuals: true });
packageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Package', packageSchema);
