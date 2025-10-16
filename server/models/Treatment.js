const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
  treatmentId: {
    type: String,
    required: true,
    unique: true
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
  treatmentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  treatmentType: {
    type: String,
    required: true,
    enum: ['consultation', 'botox', 'filler', 'laser', 'facial', 'body_treatment', 'surgery', 'other']
  },
  procedures: [{
    procedureName: { type: String, required: true },
    procedureCode: { type: String },
    description: { type: String },
    bodyPart: { type: String }, // ส่วนของร่างกายที่ทำ
    technique: { type: String }, // เทคนิคที่ใช้
    duration: { type: Number }, // นาที
    cost: { type: Number }
  }],
  
  // Face/Body Chart
  treatmentAreas: [{
    areaType: { type: String, enum: ['face', 'body'], required: true },
    coordinates: [{
      x: { type: Number },
      y: { type: Number },
      note: { type: String },
      units: { type: Number }, // สำหรับ Botox units
      volume: { type: Number } // สำหรับ Filler ml
    }],
    chartImage: { type: String } // Base64 หรือ URL ของรูป chart
  }],
  
  // Products/Materials Used
  productsUsed: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    brand: { type: String },
    lotNumber: { type: String },
    expiryDate: { type: Date },
    quantityUsed: { type: Number, required: true },
    unit: { type: String, required: true }, // ml, units, pieces
    cost: { type: Number }
  }],
  
  // Equipment/Machine Settings
  equipmentUsed: [{
    equipmentName: { type: String },
    settings: {
      energy: { type: Number }, // พลังงาน
      wavelength: { type: Number }, // ความยาวคลื่น
      pulseWidth: { type: Number },
      frequency: { type: Number },
      temperature: { type: Number },
      pressure: { type: Number },
      other: { type: String }
    }
  }],
  
  // Medical Records
  medicalRecord: {
    chiefComplaint: { type: String }, // อาการสำคัญ
    presentIllness: { type: String }, // ประวัติการเจ็บป่วยปัจจุบัน
    physicalExamination: { type: String }, // การตรวจร่างกาย
    vitalSigns: {
      bloodPressure: { type: String },
      heartRate: { type: Number },
      temperature: { type: Number },
      weight: { type: Number },
      height: { type: Number }
    },
    diagnosis: { type: String }, // การวินิจฉัย
    treatmentPlan: { type: String }, // แผนการรักษา
    prognosis: { type: String } // การพยากรณ์โรค
  },
  
  // Pre/Post Treatment Photos
  photos: {
    before: [{
      url: { type: String },
      description: { type: String },
      angle: { type: String }, // front, side, back
      bodyPart: { type: String }
    }],
    during: [{
      url: { type: String },
      description: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    after: [{
      url: { type: String },
      description: { type: String },
      angle: { type: String },
      bodyPart: { type: String },
      timePeriod: { type: String } // immediate, 1week, 1month, 3months
    }]
  },
  
  // Staff Information
  performedBy: {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assistants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  // Consent Information
  consent: {
    consentFormId: { type: String },
    consentType: { type: String },
    signedAt: { type: Date },
    signatureImage: { type: String }, // Base64 digital signature
    witnessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Post-treatment Care
  postTreatmentCare: {
    instructions: { type: String },
    prescriptions: [{
      medicationName: { type: String },
      dosage: { type: String },
      frequency: { type: String },
      duration: { type: String },
      notes: { type: String }
    }],
    nextAppointment: { type: Date },
    restrictions: [{ type: String }], // ข้อห้าม
    sideEffectsToWatch: [{ type: String }] // อาการข้างเคียงที่ต้องระวัง
  },
  
  // Follow-up
  followUp: {
    required: { type: Boolean, default: false },
    scheduledDate: { type: Date },
    completed: { type: Boolean, default: false },
    notes: { type: String }
  },
  
  // Treatment Results
  results: {
    patientSatisfaction: { type: Number, min: 1, max: 10 },
    doctorSatisfaction: { type: Number, min: 1, max: 10 },
    complications: [{ type: String }],
    sideEffects: [{ type: String }],
    effectivenessRating: { type: Number, min: 1, max: 10 },
    notes: { type: String }
  },
  
  // Billing Information
  billing: {
    totalCost: { type: Number, required: true },
    doctorFee: { type: Number },
    procedureFee: { type: Number },
    materialsCost: { type: Number },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number },
    paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' }
  },
  
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'cancelled'],
    default: 'in-progress'
  },
  
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate treatment ID
treatmentSchema.pre('save', async function(next) {
  if (!this.treatmentId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      treatmentDate: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });
    this.treatmentId = `TRT${dateStr}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Calculate total products cost
treatmentSchema.virtual('totalProductsCost').get(function() {
  return this.productsUsed.reduce((total, product) => total + (product.cost || 0), 0);
});

// Calculate total procedures cost
treatmentSchema.virtual('totalProceduresCost').get(function() {
  return this.procedures.reduce((total, procedure) => total + (procedure.cost || 0), 0);
});

treatmentSchema.set('toJSON', { virtuals: true });
treatmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Treatment', treatmentSchema);