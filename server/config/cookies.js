const isProd = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || (isProd ? undefined : 'http://localhost:3000');

function cookieOptions() {
  // Only set SameSite=None when cookie is Secure (required by browsers)
  const secure = !!(isProd && FRONTEND_URL && FRONTEND_URL.startsWith('https'));
  return {
    httpOnly: true,
    secure: secure,
    sameSite: secure ? 'None' : 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  };
}

module.exports = { cookieOptions, FRONTEND_URL };
