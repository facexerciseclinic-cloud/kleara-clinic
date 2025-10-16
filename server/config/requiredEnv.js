function validateRequiredEnv() {
  // Skip validation in serverless environments (Vercel sets them differently)
  if (process.env.VERCEL || process.env.NOW_REGION) {
    console.log('✅ Running in Vercel serverless environment');
    return;
  }
  
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'FRONTEND_URL'
  ];

  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('⚠️ Missing environment variables for production:', missing.join(', '));
    console.error('App may not function correctly. Please set them in Vercel dashboard.');
    // Don't exit in serverless - let it continue
    // process.exit(1);
  } else {
    console.log('✅ All required environment variables are set');
  }
}

module.exports = { validateRequiredEnv };
