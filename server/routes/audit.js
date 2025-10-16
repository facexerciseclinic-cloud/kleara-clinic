const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// GET /api/audit?limit=50
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
