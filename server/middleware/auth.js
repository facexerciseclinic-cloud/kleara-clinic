const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

// Verify JWT token middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Use the same fallback secret used when issuing tokens in demo mode
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kleara-clinic-secret');

    // Try to load user from database first
    let user = null;
    try {
      user = await User.findById(decoded.userId).select('-password');
    } catch (e) {
      // Ignore CastError for non-ObjectId demo IDs
    }

    // If no DB user found, allow demo users (used by server/routes/auth.js)
    if (!user) {
      const demoUsers = {
        'admin-id': {
          _id: 'admin-id',
          username: 'admin',
          email: 'admin@kleara-clinic.com',
          role: 'admin',
          isActive: true,
          profile: { firstName: 'ผู้ดูแลระบบ', lastName: 'Kleara Clinic', phone: '02-123-4567' },
          permissions: [{ module: '*', actions: ['*'] }]
        },
        'doctor-1': {
          _id: 'doctor-1',
          username: 'doctor1',
          email: 'doctor1@kleara-clinic.com',
          role: 'doctor',
          isActive: true,
          profile: { firstName: 'หมอ', lastName: 'หนึ่ง', phone: '081-000-0001' },
          permissions: [
            { module: 'appointments', actions: ['read', 'write'] },
            { module: 'treatments', actions: ['read', 'write'] }
          ]
        },
        'reception-1': {
          _id: 'reception-1',
          username: 'receptionist1',
          email: 'reception1@kleara-clinic.com',
          role: 'reception',
          isActive: true,
          profile: { firstName: 'แอดมิน', lastName: 'ต้อนรับ', phone: '081-000-0002' },
          permissions: [
            { module: 'patients', actions: ['read', 'write'] },
            { module: 'appointments', actions: ['read', 'write'] }
          ]
        }
      };

      const demo = demoUsers[decoded.userId];
      if (!demo) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }
      user = demo;
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Check permissions middleware
const checkPermission = (module, action = 'read') => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      // Admin has all permissions
      if (user.role === 'admin') {
        return next();
      }
      
      // Check if user has permission for this module and action
      const permission = user.permissions.find(p => p.module === module);
      
      if (!permission || !permission.actions.includes(action)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${module}:${action}`
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions.'
      });
    }
  };
};

// Role-based access control
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient role privileges.'
      });
    }
    next();
  };
};

module.exports = {
  generateToken,
  auth,
  checkPermission,
  requireRole
};