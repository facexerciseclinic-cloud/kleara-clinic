const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  }
}, { timestamps: true });

// Create a default setting if it doesn't exist
settingSchema.statics.findOrCreate = async function findOrCreate(key, defaultValue, name, description) {
  let setting = await this.findOne({ key });
  if (!setting) {
    setting = await this.create({ key, value: defaultValue, name, description });
  }
  return setting;
};

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
