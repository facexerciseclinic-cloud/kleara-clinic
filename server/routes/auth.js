const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

// In-memory fallback store for refresh tokens when DB is unavailable (development)
const inMemoryTokens = new Map();

async function persistRefreshTokenRecord({ jti, userId, expiresAt }) {
  try {
    if (RefreshToken && RefreshToken.create) {
      await RefreshToken.create({ jti, userId, expiresAt });
      return { jti, userId, expiresAt };
    }
  } catch (e) {
    // fall through to in-memory
  }
  inMemoryTokens.set(jti, { jti, userId, expiresAt });
  return inMemoryTokens.get(jti);
}

async function findRefreshTokenRecord(jti, userId) {
  try {
    if (RefreshToken && RefreshToken.findOne) {
      const doc = await RefreshToken.findOne({ jti, userId });
      if (doc) return doc;
    }
  } catch (e) {
    // ignore and fallback
  }
  const rec = inMemoryTokens.get(jti);
  if (rec && (!userId || rec.userId === userId)) return rec;
  return null;
}

async function deleteRefreshTokenRecord(jti) {
  try {
    if (RefreshToken && RefreshToken.deleteOne) {
      await RefreshToken.deleteOne({ jti });
    }
  } catch (e) {
    // ignore
  }
  inMemoryTokens.delete(jti);
}
const { auth, requireRole } = require('../middleware/auth');

// Simple token generation for development
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'kleara-clinic-secret', {
    expiresIn: '7d'
  });
};

const generateRefreshToken = (userId, jti) => {
  // embed jti (token id) so we can look it up in DB
  return jwt.sign({ userId, jti }, process.env.REFRESH_TOKEN_SECRET || 'kleara-clinic-refresh', {
    expiresIn: '30d'
  });
};

// helper to write token-related audit events if AuditLog model available
const writeTokenAudit = async (req, event, data = {}) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const ua = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const doc = new AuditLog({
      level: 'info',
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: 200,
      responseTimeMs: 0,
      user: req.user ? { id: req.user._id || req.user.id, role: req.user.role, username: req.user.username } : undefined,
      ip,
      userAgent: ua,
      meta: { event, ...data }
    });
    await doc.save().catch(() => {});
  } catch (e) {
    // ignore if AuditLog not available
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, password });

    // Temporary hardcoded users for development (accept demo credentials used in UI)
    const demoUsers = [
      {
        username: 'admin',
        password: 'admin123',
        user: {
          _id: 'admin-id',
          username: 'admin',
          email: 'admin@kleara-clinic.com',
          role: 'admin',
          profile: {
            firstName: 'ผู้ดูแลระบบ',
            lastName: 'Kleara Clinic',
            titleTh: 'ผู้จัดการ',
            phone: '02-123-4567'
          },
          permissions: ['*'],
          isActive: true
        }
      },
      {
        username: 'doctor1',
        password: 'doctor123',
        user: {
          _id: 'doctor-1',
          username: 'doctor1',
          email: 'doctor1@kleara-clinic.com',
          role: 'doctor',
          profile: {
            firstName: 'หมอ',
            lastName: 'หนึ่ง',
            phone: '081-000-0001'
          },
          permissions: ['appointments', 'treatments'],
          isActive: true
        }
      },
      {
        username: 'receptionist1',
        password: 'recep123',
        user: {
          _id: 'reception-1',
          username: 'receptionist1',
          email: 'reception1@kleara-clinic.com',
          role: 'reception',
          profile: {
            firstName: 'แอดมิน',
            lastName: 'ต้อนรับ',
            phone: '081-000-0002'
          },
          permissions: ['appointments', 'patients'],
          isActive: true
        }
      }
    ];

    const matched = demoUsers.find(u => u.username === username && u.password === password);
    if (matched) {
      const token = generateToken(matched.user._id);
      // create a jti and persist refresh token in DB
      const jti = crypto.randomBytes(16).toString('hex');
      const refreshToken = generateRefreshToken(matched.user._id, jti);

  // persist refresh token record (DB or in-memory fallback)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await persistRefreshTokenRecord({ jti, userId: matched.user._id, expiresAt });

          // Set refresh token as httpOnly secure cookie
      const { cookieOptions } = require('../config/cookies');
      const co = cookieOptions();
      console.log('Setting refresh cookie with options:', co);
      res.cookie('refreshToken', refreshToken, co);
      
      // Transform permissions array to match frontend structure
      const permissions = matched.user.permissions.map(p => {
        if (p === '*') {
          return { module: '*', actions: ['*'] };
        }
        return { module: p, actions: ['read', 'write', 'delete'] };
      });
      
      return res.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        data: {
          token,
          user: {
            _id: matched.user._id,  // Changed from 'id' to '_id'
            employeeId: matched.user._id,  // Add employeeId
            username: matched.user.username,
            email: matched.user.email,
            role: matched.user.role,
            profile: matched.user.profile,
            permissions: permissions,  // Transform to object array
            fullName: `${matched.user.profile.firstName} ${matched.user.profile.lastName}`,
            isActive: matched.user.isActive
          }
        }
      });
    }

    // Invalid credentials
    return res.status(401).json({
      success: false,
      message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kleara-clinic-secret');
    
    // Return hardcoded user for development
    const user = {
      _id: 'admin-id',
      username: 'admin',
      email: 'admin@kleara-clinic.com',
      role: 'admin',
      profile: {
        firstName: 'ผู้ดูแลระบบ',
        lastName: 'Kleara Clinic',
        titleTh: 'ผู้จัดการ',
        phone: '02-123-4567'
      },
      permissions: ['*']
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
          permissions: user.permissions
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', async (req, res) => {
  // Clear refresh token cookie and remove from DB if present
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'kleara-clinic-refresh');
      const jti = decoded.jti;
      // remove DB or in-memory record
      try { await deleteRefreshTokenRecord(jti); } catch (e) {}
      try { await writeTokenAudit(req, 'refresh_logout', { jti, userId: decoded.userId }); } catch (e) {}
    } catch (e) {
      // ignore
    }
  }
  const { cookieOptions } = require('../config/cookies');
  // clearCookie expects flags similar to set; reuse secure and sameSite
  res.clearCookie('refreshToken', { httpOnly: cookieOptions().httpOnly, secure: cookieOptions().secure, sameSite: cookieOptions().sameSite });
  res.json({
    success: true,
    message: 'ออกจากระบบสำเร็จ'
  });
});

// @route POST /api/auth/refresh
// @desc   Refresh access token using httpOnly refresh token cookie
// @access Public (cookie-based)
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'kleara-clinic-refresh');

    // Verify refresh token exists in DB and not replaced
    const jti = decoded.jti;
  const stored = await findRefreshTokenRecord(jti, decoded.userId);
  if (!stored) return res.status(401).json({ success: false, message: 'Refresh token revoked or not found' });

    // Rotate: create new jti, create record, mark old replacedBy
    const newJti = crypto.randomBytes(16).toString('hex');
    const newRefreshToken = generateRefreshToken(decoded.userId, newJti);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Persist new and mark old replaced
    await persistRefreshTokenRecord({ jti: newJti, userId: decoded.userId, expiresAt });
    try {
      if (stored && stored.replacedBy !== undefined) {
        stored.replacedBy = newJti;
        if (stored.save) await stored.save();
        else inMemoryTokens.set(stored.jti, stored);
      }
    } catch (e) {
      // ignore
    }

    // Issue new access token
    const newAccess = generateToken(decoded.userId);
  const { cookieOptions } = require('../config/cookies');
  const co2 = cookieOptions();
  console.log('Rotating refresh cookie with options:', co2);
  res.cookie('refreshToken', newRefreshToken, co2);
    return res.json({ success: true, data: { token: newAccess } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

module.exports = router;

// --- Admin endpoints for refresh tokens ---
// (Note: in production, protect with proper auth middleware/checks)
// Admin endpoints: require authenticated admin user
router.get('/refresh-tokens', auth, requireRole('admin'), async (req, res) => {
  try {
    const tokens = await RefreshToken.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, data: tokens });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/refresh-tokens/:jti', auth, requireRole('admin'), async (req, res) => {
  try {
    const { jti } = req.params;
    await RefreshToken.deleteOne({ jti });
    res.json({ success: true, message: 'Token revoked' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});