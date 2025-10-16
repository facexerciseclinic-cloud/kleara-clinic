const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    method: String,
    path: String,
    statusCode: Number,
    responseTimeMs: Number,
    user: {
      id: String,
      role: String,
      username: String,
    },
    ip: String,
    userAgent: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ path: 1, method: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
