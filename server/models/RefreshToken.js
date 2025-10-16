const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  replacedBy: { type: String, default: null }
});

// TTL index to auto-remove expired refresh tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
