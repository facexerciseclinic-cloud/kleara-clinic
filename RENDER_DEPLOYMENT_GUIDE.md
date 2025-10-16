# 🚀 Deploy Kleara Clinic Server บน Render.com

## 📋 ขั้นตอนการ Deploy (5-10 นาที)

### Step 1: สร้างบัญชี Render.com

1. ไปที่ **https://render.com**
2. คลิก **"Get Started"** หรือ **"Sign Up"**
3. เลือก sign up ด้วย:
   - GitHub (แนะนำ - ถ้ามี)
   - GitLab
   - Google
   - Email

### Step 2: สร้าง Web Service

1. หลังจาก login แล้ว คลิก **"New +"** (มุมขวาบน)
2. เลือก **"Web Service"**
3. เลือกวิธี deploy:

#### Option A: จาก GitHub (แนะนำ ถ้ามี repo)
- Connect GitHub repository
- เลือก repo ของ Kleara Clinic
- Branch: main หรือ master

#### Option B: Upload Files (ถ้าไม่มี GitHub)
- เลือก **"Public Git Repository"**
- ใส่ URL: (ถ้ามี)
- หรือ เลือก **"Deploy from your computer"** แล้ว upload folder `server/`

### Step 3: Configure Service

กรอกข้อมูลดังนี้:

```
Name: kleara-clinic-api
(หรือชื่อที่คุณต้องการ - จะเป็นส่วนหนึ่งของ URL)

Region: Singapore
(เลือก Singapore เพราะใกล้ไทยที่สุด)

Branch: main
(ถ้าใช้ GitHub)

Root Directory: server
(หรือเว้นว่างถ้า upload เฉพาะ folder server)

Environment: Node

Build Command:
npm install

Start Command:
node app.js

Instance Type: Free
(เลือก Free tier - เพียงพอสำหรับ development)
```

### Step 4: ตั้งค่า Environment Variables

คลิกที่ **"Advanced"** หรือ **"Environment"** แล้วเพิ่มตัวแปรเหล่านี้:

#### คัดลอกและวางทีละตัว:

```
Key: MONGODB_URI
Value: mongodb+srv://kleara_admin:Kleara2025!@kleara-clinic.khhfz8j.mongodb.net/kleara_clinic?retryWrites=true&w=majority&appName=kleara-clinic
```

```
Key: JWT_SECRET
Value: kleara-clinic-secret-key-2025-production
```

```
Key: REFRESH_TOKEN_SECRET
Value: kleara-refresh-token-secret-2025-production
```

```
Key: NODE_ENV
Value: production
```

```
Key: FRONTEND_URL
Value: https://client-six-tau-64.vercel.app
```

```
Key: PORT
Value: 5002
```

```
Key: RATE_LIMIT_MAX
Value: 100
```

```
Key: RATE_LIMIT_WINDOW
Value: 15
```

### Step 5: Deploy!

1. คลิก **"Create Web Service"** (ปุ่มสีฟ้าด้านล่าง)
2. รอ Render build และ deploy (ประมาณ 2-3 นาที)
3. ดู logs ตรวจสอบว่า deploy สำเร็จ

### Step 6: ตรวจสอบว่า Server ทำงาน

เมื่อ deploy เสร็จ คุณจะได้ URL แบบนี้:
```
https://kleara-clinic-api.onrender.com
```

ทดสอบโดยเปิด:
```
https://kleara-clinic-api.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Kleara Clinic Management System is running",
  "timestamp": "2025-10-16T...",
  "environment": "production"
}
```

---

## 🔄 Step 7: อัปเดต Client ให้ชี้ไปที่ Render

หลังจาก server บน Render ทำงานแล้ว:

### 7.1 เปิด PowerShell และรันคำสั่ง:

```powershell
# ไปที่ client directory
cd "c:\Clinic System\client"

# ลบ env variable เก่า
vercel env rm REACT_APP_API_URL production

# เพิ่ม env variable ใหม่ (เปลี่ยน URL ให้ตรงกับของคุณ)
echo "https://kleara-clinic-api.onrender.com/api" | vercel env add REACT_APP_API_URL production
```

### 7.2 อัปเดตไฟล์ `.env.production`:

เปิดไฟล์ `client/.env.production` และเปลี่ยนเป็น:
```
REACT_APP_API_URL=https://kleara-clinic-api.onrender.com/api
REACT_APP_ENV=production
```
(เปลี่ยน `kleara-clinic-api` ให้ตรงกับชื่อ service ของคุณ)

### 7.3 Build และ Deploy Client ใหม่:

```powershell
# Build client
npm run build

# Deploy to Vercel
vercel --prod --yes
```

---

## ✅ Step 8: ทดสอบทั้งระบบ

### 8.1 ทดสอบ Server
```
https://kleara-clinic-api.onrender.com/api/health
```
ควรเห็น JSON response

### 8.2 ทดสอบ Client
```
https://client-six-tau-64.vercel.app
```
1. เปิด Developer Tools (F12)
2. ไปที่ Console tab
3. ไม่ควรมี CORS errors
4. Network tab ควรเห็น API calls ไปที่ Render URL

### 8.3 ทดสอบ Login
- พยายาม login ด้วย staff หรือ patient account
- ควรเข้าสู่ระบบได้

### 8.4 ทดสอบ Features
- ✅ Patient Portal
- ✅ Loyalty Points
- ✅ Referral Program

---

## 🎯 ข้อดีของ Render.com

| Feature | Render | Vercel Serverless |
|---------|--------|-------------------|
| Express Support | ✅ ยอดเยี่ยม | ⚠️ พอใช้ได้ |
| MongoDB Connection | ✅ ไม่มีปัญหา | ❌ Cold start issues |
| Setup | ✅ ง่าย | ⚠️ ซับซ้อน |
| Free Tier | ✅ 750 hours/month | ✅ Unlimited |
| Cold Start | ✅ น้อยมาก | ❌ มาก |
| Logs & Monitoring | ✅ ดีมาก | ✅ ดี |
| **Recommended for Node + MongoDB** | ✅ | ❌ |

---

## 📊 Free Tier Limits

Render Free Tier:
- ✅ 750 hours/month (เพียงพอสำหรับ 1 service 24/7)
- ✅ 512 MB RAM
- ✅ Shared CPU
- ✅ Automatic SSL
- ⚠️ Spins down after 15 minutes of inactivity (cold start ~30s)
- ✅ 100 GB bandwidth/month

---

## 🔧 Troubleshooting

### ปัญหา: Build Failed
**Solution**: ตรวจสอบว่า `package.json` มี dependencies ครบ

### ปัญหา: Service Crashed
**Solution**: ดู Logs และตรวจสอบ environment variables

### ปัญหา: Cannot Connect to MongoDB
**Solution**: 
1. ตรวจสอบ MONGODB_URI ใน environment variables
2. ตรวจสอบว่า MongoDB Atlas อนุญาต IP `0.0.0.0/0`

### ปัญหา: CORS Error
**Solution**: ตรวจสอบ FRONTEND_URL ใน environment variables

---

## 💡 Tips

1. **Enable Auto Deploy**: 
   - ใน Render dashboard → Settings → Auto-Deploy
   - Enable เพื่อให้ deploy อัตโนมัติเมื่อ push code ใหม่

2. **Monitor Logs**:
   - Render มี real-time logs ที่ดูง่าย
   - คลิกที่ "Logs" ใน dashboard

3. **Health Checks**:
   - Render จะ ping `/api/health` เพื่อตรวจสอบว่า service ทำงาน
   - ถ้า health check fail จะ restart service อัตโนมัติ

4. **Custom Domain** (Optional):
   - ไปที่ Settings → Custom Domain
   - เพิ่ม domain ของคุณเอง (เช่น api.kleara.com)

---

## 📞 Need Help?

ถ้ามีปัญหาขั้นตอนไหน แจ้งผมได้เลยครับ!

**หลังจาก deploy เสร็จ กรุณาแจ้ง:**
1. ✅ Deploy สำเร็จ + URL ของ Render
2. หรือ ❌ มีปัญหาขั้นตอนไหน

**จากนั้นผมจะช่วยอัปเดต client ให้เชื่อมต่อกับ Render ทันที!**

---

**Ready to Deploy?** 🚀  
**Go to**: https://render.com
