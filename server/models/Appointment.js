const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentNumber: {
    type: String,
    required: true,
    unique: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    start: { type: String, required: true }, // "09:00"
    end: { type: String, required: true }    // "10:00"
  },
  services: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: { type: String, required: true },
    estimatedDuration: { type: Number }, // minutes
    price: { type: Number }
  }],
  assignedStaff: {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  resources: {
    room: { type: String }, // Room number or name
    equipment: [{ type: String }] // Required equipment
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'treatment', 'follow-up', 'emergency'],
    default: 'consultation'
  },
  notes: { type: String },
  specialInstructions: { type: String },
  
  // Booking information
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bookingChannel: {
    type: String,
    enum: ['walk-in', 'phone', 'online', 'line', 'app'],
    default: 'walk-in'
  },
  
  // Check-in information
  checkedInAt: { type: Date },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  
  // Cancellation information
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String },
  
  // Reminder information
  reminders: [{
    type: { type: String, enum: ['sms', 'email', 'line'] },
    sentAt: { type: Date },
    status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'] }
  }],
  
  // Follow-up information
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  followUpNotes: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate appointment number
appointmentSchema.pre('save', async function(next) {
  if (!this.appointmentNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      appointmentDate: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });
    this.appointmentNumber = `APT${dateStr}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Calculate total duration
appointmentSchema.virtual('totalDuration').get(function() {
  return this.services.reduce((total, service) => total + (service.estimatedDuration || 0), 0);
});

// Calculate total price
appointmentSchema.virtual('totalPrice').get(function() {
  return this.services.reduce((total, service) => total + (service.price || 0), 0);
});

// Check if appointment is today
appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  return appointmentDate.toDateString() === today.toDateString();
});

// Check if appointment is overdue
appointmentSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.timeSlot.end.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
  
  return now > appointmentDateTime && this.status !== 'completed' && this.status !== 'cancelled';
});

appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Appointment', appointmentSchema);