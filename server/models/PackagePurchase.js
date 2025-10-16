const mongoose = require('mongoose');

const packagePurchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  
  // Purchase details
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  
  price: {
    original: { type: Number },
    paid: { type: Number, required: true },
    discount: { type: Number, default: 0 }
  },
  
  // Payment info
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit-card', 'bank-transfer', 'promptpay', 'installment'],
    required: true
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  transactionId: {
    type: String
  },
  
  // Validity period
  validFrom: {
    type: Date,
    default: Date.now
  },
  
  validUntil: {
    type: Date,
    required: true
  },
  
  // Package usage tracking
  services: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: { type: String, required: true },
    totalQuantity: { type: Number, required: true }, // จำนวนทั้งหมดที่มีสิทธิ์
    usedQuantity: { type: Number, default: 0 }, // จำนวนที่ใช้ไปแล้ว
    remainingQuantity: { type: Number }, // จำนวนที่เหลือ
    
    // Usage history
    usageHistory: [{
      usedAt: { type: Date },
      appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
      treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Treatment' },
      quantity: { type: Number, default: 1 },
      notes: { type: String }
    }]
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'used-up', 'cancelled', 'refunded'],
    default: 'active'
  },
  
  // Notes
  notes: {
    type: String
  },
  
  // Sold by
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate purchase number
packagePurchaseSchema.pre('save', async function(next) {
  if (!this.packageNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });
    this.purchaseNumber = `PP${dateStr}${String(count + 1).padStart(3, '0')}`;
  }
  
  // Update remaining quantity for each service
  this.services.forEach(service => {
    service.remainingQuantity = service.totalQuantity - service.usedQuantity;
  });
  
  // Auto-update status
  const now = new Date();
  if (now > this.validUntil) {
    this.status = 'expired';
  } else if (this.services.every(s => s.remainingQuantity <= 0)) {
    this.status = 'used-up';
  }
  
  next();
});

// Method: Use service from package
packagePurchaseSchema.methods.useService = function(serviceId, quantity = 1, appointmentId, notes) {
  const service = this.services.find(s => s.serviceId.toString() === serviceId.toString());
  
  if (!service) {
    throw new Error('Service not found in package');
  }
  
  if (service.remainingQuantity < quantity) {
    throw new Error('Insufficient remaining quantity');
  }
  
  if (this.status !== 'active') {
    throw new Error('Package is not active');
  }
  
  const now = new Date();
  if (now > this.validUntil) {
    throw new Error('Package has expired');
  }
  
  // Add usage record
  service.usageHistory.push({
    usedAt: now,
    appointmentId,
    quantity,
    notes
  });
  
  // Update quantities
  service.usedQuantity += quantity;
  service.remainingQuantity -= quantity;
  
  return this.save();
};

// Calculate total usage percentage
packagePurchaseSchema.virtual('usagePercentage').get(function() {
  const totalServices = this.services.reduce((sum, s) => sum + s.totalQuantity, 0);
  const usedServices = this.services.reduce((sum, s) => sum + s.usedQuantity, 0);
  
  if (totalServices === 0) return 0;
  return Math.round((usedServices / totalServices) * 100);
});

// Check if package is expired
packagePurchaseSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Check if all services are used
packagePurchaseSchema.virtual('isUsedUp').get(function() {
  return this.services.every(s => s.remainingQuantity <= 0);
});

packagePurchaseSchema.set('toJSON', { virtuals: true });
packagePurchaseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PackagePurchase', packagePurchaseSchema);
