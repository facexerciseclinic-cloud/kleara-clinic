# Render Deployment Configuration

## Build Command
```
npm install
```

## Start Command
```
node app.js
```

## Environment Variables (ต้องตั้งใน Render Dashboard)

### Required Variables:
```
MONGODB_URI=mongodb+srv://kleara_admin:Kleara2025!@kleara-clinic.khhfz8j.mongodb.net/kleara_clinic?retryWrites=true&w=majority&appName=kleara-clinic

JWT_SECRET=kleara-clinic-secret-key-2025-production

REFRESH_TOKEN_SECRET=your-refresh-token-secret-here

NODE_ENV=production

FRONTEND_URL=https://client-six-tau-64.vercel.app

PORT=5002

RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
```

## Service Type
- **Type**: Web Service
- **Environment**: Node
- **Region**: Singapore (แนะนำ) หรือ Oregon
- **Instance Type**: Free

## Health Check
- **Path**: /api/health
- **Type**: HTTP

## Auto Deploy
- **Enabled**: Yes (จาก GitHub หรือ Manual)
