const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kleara_clinic';
const MAX_RETRIES = parseInt(process.env.DB_CONNECT_RETRIES || '3');
const RETRY_INTERVAL_MS = parseInt(process.env.DB_CONNECT_RETRY_INTERVAL_MS || '1000');

let retries = 0;
let isConnected = false;

// Mongoose options for serverless
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000,
};

async function connect() {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('📊 MongoDB already connected');
    return;
  }
  
  try {
    // Use modern mongoose connect signature
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    isConnected = true;
    console.log('📊 Connected to MongoDB - Kleara Clinic Database');
  } catch (err) {
    retries++;
    console.error(`❌ MongoDB connection error (attempt ${retries}):`, err.message || err);
    if (retries <= MAX_RETRIES) {
      console.log(`🔁 Retrying DB connect in ${RETRY_INTERVAL_MS}ms...`);
      await new Promise(r => setTimeout(r, RETRY_INTERVAL_MS));
      return connect();
    }
    console.log('⚠️  Giving up connecting to MongoDB after multiple attempts. Continuing without DB.');
    // Don't throw error, let app continue
  }
}

function connected() {
  return isConnected || mongoose.connection.readyState === 1;
}

module.exports = {
  connect,
  connected
};
