const http = require('http');
const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', () => {});
  res.on('end', () => process.exit(0));
});
req.on('error', err => { console.error('Request error', err); process.exit(1); });
req.write(JSON.stringify({ username: 'admin', password: 'admin123' }));
req.end();
