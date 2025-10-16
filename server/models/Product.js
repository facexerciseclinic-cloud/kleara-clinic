const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
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
    enum: ['medication', 'cosmetic', 'equipment', 'consumable', 'supplement', 'device']
  },
  subCategory: { type: String },
  brand: { type: String },
  manufacturer: { type: String },
  
  // Pricing
  pricing: {
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    memberPrice: { type: Number }, // ราคาสำหรับสมาชิก
    vipPrice: { type: Number }, // ราคาสำหรับ VIP
    commissionRate: { type: Number, default: 0 } // อัตราค่าคอมมิชชั่น %
  },
  
  // Inventory
  inventory: {
    currentStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 }, // สต็อกที่จองไว้
    minStock: { type: Number, default: 0 }, // จุดสั่งซื้อขั้นต่ำ
    maxStock: { type: Number }, // สต็อกสูงสุด
    unit: { type: String, required: true }, // ml, units, pieces, boxes
    storageLocation: { type: String },
    storageConditions: { type: String } // เงื่อนไขการเก็บ
  },
  
  // Lot tracking
  lots: [{
    lotNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    manufacturingDate: { type: Date },
    quantity: { type: Number, required: true },
    remainingQuantity: { type: Number, required: true },
    supplier: { type: String },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number },
    status: { type: String, enum: ['active', 'expired', 'recalled'], default: 'active' }
  }],
  
  // Product specifications
  specifications: {
    volume: { type: Number }, // ปริมาตร
    concentration: { type: String }, // ความเข้มข้น
    activeIngredients: [{ type: String }], // สารสำคัญ
    contraindications: [{ type: String }], // ข้อห้าม
    sideEffects: [{ type: String }], // ผลข้างเคียง
    usageInstructions: { type: String }, // วิธีใช้
    dosage: { type: String }, // ขนาดการใช้
    frequency: { type: String } // ความถี่ในการใช้
  },
  
  // Regulatory information
  regulatory: {
    fdaNumber: { type: String }, // เลขที่ อย.
    importLicense: { type: String },
    registrationNumber: { type: String },
    approvalDate: { type: Date },
    expiryDate: { type: Date }
  },
  
  // Supplier information
  suppliers: [{
    supplierName: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    leadTime: { type: Number }, // วันที่ใช้ในการส่งมอบ
    minimumOrder: { type: Number },
    isPreferred: { type: Boolean, default: false }
  }],
  
  // Usage tracking
  usage: {
    totalUsed: { type: Number, default: 0 },
    lastUsedDate: { type: Date },
    averageMonthlyUsage: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 } // คะแนนความนิยม
  },
  
  // Images and documents
  images: [{
    url: { type: String },
    type: { type: String, enum: ['product', 'packaging', 'certificate', 'manual'] },
    description: { type: String }
  }],
  
  // Tags for categorization and search
  tags: [{ type: String }],
  
  // Status
  isActive: { type: Boolean, default: true },
  isForSale: { type: Boolean, default: true }, // ขายได้หรือไม่
  isForTreatment: { type: Boolean, default: true }, // ใช้ในการรักษาได้หรือไม่
  requiresPrescription: { type: Boolean, default: false }, // ต้องมีใบสั่งแพทย์หรือไม่
  
  // Audit trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Calculate available stock (current - reserved)
productSchema.virtual('availableStock').get(function() {
  return this.inventory.currentStock - this.inventory.reservedStock;
});

// Check if stock is low
productSchema.virtual('isLowStock').get(function() {
  return this.availableStock <= this.inventory.minStock;
});

// Check if any lots are near expiry (within 30 days)
productSchema.virtual('hasNearExpiryLots').get(function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return this.lots.some(lot => 
    lot.status === 'active' && 
    lot.remainingQuantity > 0 && 
    lot.expiryDate <= thirtyDaysFromNow
  );
});

// Get profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.pricing.costPrice === 0) return 0;
  return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
});

// Get total stock value
productSchema.virtual('totalStockValue').get(function() {
  return this.inventory.currentStock * this.pricing.costPrice;
});

// Generate product code
productSchema.pre('save', async function(next) {
  if (!this.productCode) {
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const count = await this.constructor.countDocuments({ category: this.category });
    this.productCode = `${categoryCode}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update usage statistics
productSchema.methods.updateUsage = function(quantityUsed) {
  this.usage.totalUsed += quantityUsed;
  this.usage.lastUsedDate = new Date();
  // Calculate average monthly usage (simplified)
  const monthsSinceCreation = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24 * 30);
  this.usage.averageMonthlyUsage = this.usage.totalUsed / Math.max(monthsSinceCreation, 1);
};

// Index for search
productSchema.index({ 
  'name.th': 'text', 
  'name.en': 'text',
  'productCode': 'text',
  'brand': 'text',
  'tags': 'text'
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);