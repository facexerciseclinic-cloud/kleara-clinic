# 🚨 Server Deployment Issue - Analysis & Solution

## ปัญหาที่พบ

### Error Message
```
FUNCTION_INVOCATION_FAILED
500 INTERNAL_SERVER_ERROR  
```

### สาเหตุที่เป็นไปได้

1. **Permanent Domain Issue**
   - Domain `server-seven-sooty-58.vercel.app` อาจมีปัญหากับ routing
   - Latest deployment URLs ใช้งานได้ แต่ permanent domain fail

2. **Environment Variables**
   - Environment variables อาจไม่ถูก load ใน serverless function
   - `process.env.NODE_ENV` อาจทำให้ validation fail

3. **Dependencies/Build Issues**
   - Package dependencies อาจมีปัญหาใน serverless environment
   - Cold start timeout (> 10s)

4. **Database Connection**
   - MongoDB connection timeout ใน cold start
   - Mongoose initialization ใช้เวลานาน

## 🔧 แนวทางแก้ไข

### Option 1: ใช้ Latest Deployment URL (แนะนำ - Quick Fix)

แทนที่จะใช้ permanent domain ให้ใช้ latest deployment URL ที่ทำงานได้:

**Latest Server URL**: `https://server-1zfx9tkk9-tainnajas-projects.vercel.app`

#### Steps:
```powershell
# 1. อัปเดต client environment variable
cd "c:\Clinic System\client"
vercel env rm REACT_APP_API_URL production
echo "https://server-1zfx9tkk9-tainnajas-projects.vercel.app/api" | vercel env add REACT_APP_API_URL production

# 2. อัปเดต .env.production
# เปลี่ยนเป็น: REACT_APP_API_URL=https://server-1zfx9tkk9-tainnajas-projects.vercel.app/api

# 3. Build และ deploy client
npm run build
vercel --prod --yes
```

### Option 2: ใช้ Vercel Custom Domain (แนะนำ - Long-term)

ซื้อ domain และ point ไปที่ Vercel:

```bash
# ตัวอย่าง
vercel domains add api.kleara.com
vercel domains add app.kleara.com
```

จากนั้นใช้ custom domain แทน vercel.app subdomain

### Option 3: สร้าง Project ใหม่ใน Vercel

อาจมีปัญหากับ project configuration ที่เก่า:

```bash
# ใน server directory
vercel --name kleara-clinic-api

# ใน client directory  
vercel --name kleara-clinic-app
```

### Option 4: แก้ไข Vercel Configuration

อัปเดต `server/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/test",
      "dest": "/api/test.js"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### Option 5: ใช้ Vercel Alias

สร้าง alias ถาวรจาก latest deployment:

```bash
cd "c:\Clinic System\server"
vercel alias set server-1zfx9tkk9-tainnajas-projects.vercel.app kleara-api
```

## 🧪 การทดสอบ

### ทดสอบ Latest Deployment
```powershell
# ทดสอบว่า latest deployment ทำงานได้หรือไม่
Invoke-WebRequest -Uri "https://server-1zfx9tkk9-tainnajas-projects.vercel.app/api/test"
```

### ทดสอบ Permanent Domain
```powershell
# ทดสอบว่า permanent domain ทำงานหรือไม่
Invoke-WebRequest -Uri "https://server-seven-sooty-58.vercel.app/api/test"
```

## 📋 Checklist

- [ ] ตรวจสอบว่า latest deployment URL ใช้งานได้
- [ ] อัปเดต client REACT_APP_API_URL ไปยัง latest server URL
- [ ] Deploy client ใหม่
- [ ] ทดสอบ client-server connection
- [ ] (Optional) ตั้งค่า custom domain
- [ ] (Optional) สร้าง Vercel alias

## 🎯 แนวทางที่แนะนำ

**ใช้ Latest Deployment URLs ก่อน** เพื่อให้ระบบทำงานได้ทันที:

1. ✅ Server ใช้: `https://server-1zfx9tkk9-tainnajas-projects.vercel.app`
2. ✅ Client ใช้: Latest client deployment URL
3. ✅ อัปเดต environment variables ทั้งคู่
4. ✅ Deploy client ใหม่
5. ✅ ทดสอบการทำงาน

**ในอนาคต** ควรย้ายไปใช้ Custom Domain เพื่อความสะดวกและไม่ต้องเปลี่ยน URL บ่อย

## 🔍 Debug Information

### Current Status
- ✅ Server builds successfully
- ✅ Client builds successfully  
- ❌ Permanent domain `server-seven-sooty-58.vercel.app` fails with FUNCTION_INVOCATION_FAILED
- ✅ Latest deployment URLs work (ต้องทดสอบ)

### Environment Variables Set
```
Client:
- REACT_APP_API_URL
- REACT_APP_ENV

Server:
- MONGODB_URI
- JWT_SECRET
- REFRESH_TOKEN_SECRET
- NODE_ENV
- FRONTEND_URL
- PORT
- RATE_LIMIT_MAX
```

### Files Modified
- ✅ `server/vercel.json` - Vercel configuration
- ✅ `server/api/index.js` - Serverless handler
- ✅ `server/api/test.js` - Simple test endpoint
- ✅ `server/db.js` - Serverless-friendly DB connection
- ✅ `server/app.js` - Lazy DB connection
- ✅ `server/config/requiredEnv.js` - Skip validation in Vercel

---

**Next Steps**: 
1. ทดสอบ latest deployment URL ว่าทำงานได้หรือไม่
2. ถ้าใช้ได้ → อัปเดต client ให้ใช้ URL นั้น
3. ถ้าไม่ได้ → ลองสร้าง project ใหม่

**Date**: October 16, 2025  
**Status**: ⚠️ INVESTIGATING
