const AuditLog = require('../models/AuditLog');

const shouldSkip = (req) => {
  if (req.method === 'OPTIONS') return true;
  const p = req.path || '';
  return (
    p.startsWith('/api/health') ||
    p.startsWith('/uploads') ||
    p === '/favicon.ico'
  );
};

module.exports = function auditMiddleware() {
  return async function (req, res, next) {
    if (shouldSkip(req)) return next();

    const start = Date.now();
    const ua = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

    // Hook into response finish
    res.on('finish', async () => {
      try {
        const doc = new AuditLog({
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          responseTimeMs: Date.now() - start,
          user: req.user
            ? { id: req.user._id || req.user.id, role: req.user.role, username: req.user.username }
            : undefined,
          ip,
          userAgent: ua,
        });
        await doc.save().catch(() => {});
      } catch (_) {}
    });

    next();
  };
};
