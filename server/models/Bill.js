const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  billType: {
    type: String,
    enum: ['receipt', 'tax_invoice', 'quote', 'deposit'],
    default: 'receipt'
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  treatment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment'
  },
  
  // Bill items
  items: [{
    type: { type: String, enum: ['service', 'product', 'package'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    itemCode: { type: String },
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    discount: {
      type: { type: String, enum: ['percentage', 'amount'], default: 'amount' },
      value: { type: Number, default: 0 }
    },
    totalPrice: { type: Number, required: true },
    
    // For package items
    packageUsage: {
      packageId: { type: mongoose.Schema.Types.ObjectId },
      sessionsUsed: { type: Number, default: 0 },
      sessionsRemaining: { type: Number }
    },
    
    // Commission information
    commission: {
      doctor: {
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      },
      therapist: {
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      },
      sales: {
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      }
    }
  }],
  
  // Pricing summary
  pricing: {
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 7 }, // VAT 7%
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true }
  },
  
  // Discount information
  discounts: [{
    type: { type: String, enum: ['member', 'promotion', 'staff', 'loyalty_points', 'coupon'] },
    description: { type: String },
    value: { type: Number },
    isPercentage: { type: Boolean, default: false },
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Loyalty points
  loyaltyPoints: {
    earned: { type: Number, default: 0 },
    redeemed: { type: Number, default: 0 },
    rate: { type: Number, default: 1 } // 1 บาท = 1 คะแนน
  },
  
  // Payment information
  payments: [{
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'qr_code', 'check'],
      required: true 
    },
    amount: { type: Number, required: true },
    reference: { type: String }, // เลขอ้างอิง
    cardNumber: { type: String }, // 4 หลักสุดท้าย
    bankName: { type: String },
    approvalCode: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'failed', 'cancelled'], default: 'approved' }
  }],
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'overpaid', 'refunded'],
    default: 'unpaid'
  },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number },
  
  // Refund information
  refunds: [{
    refundDate: { type: Date },
    amount: { type: Number },
    reason: { type: String },
    method: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reference: { type: String }
  }],
  
  // Customer information (for tax invoice)
  customerInfo: {
    name: { type: String },
    address: { type: String },
    taxId: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  
  // Bill dates
  billDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  
  // Notes and comments
  notes: { type: String },
  internalNotes: { type: String }, // ไม่ปรินต์ในใบเสร็จ
  
  // Staff information
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Print and send information
  printed: {
    count: { type: Number, default: 0 },
    lastPrintedAt: { type: Date },
    lastPrintedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  emailSent: {
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    sentTo: { type: String }
  },
  smsSent: {
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    sentTo: { type: String }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'cancelled', 'voided'],
    default: 'confirmed'
  },
  
  // Cancellation information
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate bill number
billSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = this.billType === 'tax_invoice' ? 'INV' : 'RCP';
    
    const count = await this.constructor.countDocuments({
      billType: this.billType,
      createdAt: {
        $gte: new Date(year, today.getMonth(), 1),
        $lt: new Date(year, today.getMonth() + 1, 1)
      }
    });
    
    this.billNumber = `${prefix}${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate remaining amount
  this.remainingAmount = this.pricing.grandTotal - this.paidAmount;
  
  // Update payment status
  if (this.paidAmount === 0) {
    this.paymentStatus = 'unpaid';
  } else if (this.paidAmount < this.pricing.grandTotal) {
    this.paymentStatus = 'partial';
  } else if (this.paidAmount === this.pricing.grandTotal) {
    this.paymentStatus = 'paid';
  } else {
    this.paymentStatus = 'overpaid';
  }
  
  next();
});

// Calculate total commission
billSchema.virtual('totalCommission').get(function() {
  return this.items.reduce((total, item) => {
    const doctorCommission = item.commission.doctor.amount || 0;
    const therapistCommission = item.commission.therapist.amount || 0;
    const salesCommission = item.commission.sales.amount || 0;
    return total + doctorCommission + therapistCommission + salesCommission;
  }, 0);
});

// Get commission by staff
billSchema.methods.getCommissionByStaff = function(staffId) {
  let totalCommission = 0;
  
  this.items.forEach(item => {
    if (item.commission.doctor.staffId && item.commission.doctor.staffId.toString() === staffId.toString()) {
      totalCommission += item.commission.doctor.amount || 0;
    }
    if (item.commission.therapist.staffId && item.commission.therapist.staffId.toString() === staffId.toString()) {
      totalCommission += item.commission.therapist.amount || 0;
    }
    if (item.commission.sales.staffId && item.commission.sales.staffId.toString() === staffId.toString()) {
      totalCommission += item.commission.sales.amount || 0;
    }
  });
  
  return totalCommission;
};

billSchema.set('toJSON', { virtuals: true });
billSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bill', billSchema);