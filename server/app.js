const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const cookieParser = require('cookie-parser');

const app = express();

// Security middleware
app.use(helmet());

// CORS - Allow all Vercel domains
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    // Allow all vercel.app domains
    if (origin.includes('vercel.app')) return callback(null, true);
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    callback(null, true); // Allow all for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection - simple approach
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kleara_clinic';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('📊 MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/treatments', require('./routes/treatments'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/integrations', require('./routes/integrations'));

// New modern features
app.use('/api/line', require('./routes/line'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/referral', require('./routes/referral'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kleara Clinic Management System is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// The server is now API-only. The client is served from a separate Vercel project.

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5002;

// Start server only when this file is run directly (not when required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🏥 Kleara Clinic Management Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
  });
}

// Export the Express app (for serverless deployment or testing)
module.exports = app;