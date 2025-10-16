# 🚀 Quick Start - Deploy ใน 15 นาที!

## 📝 สิ่งที่ต้องมี
- [ ] บัญชี Vercel (สมัครฟรี)
- [ ] บัญชี MongoDB Atlas (สมัครฟรี)
- [ ] Node.js ติดตั้งบนเครื่อง

---

## Step 1: Setup MongoDB Atlas (5 นาที)

### 1.1 สมัคร MongoDB Atlas
```
👉 ไปที่: https://www.mongodb.com/cloud/atlas/register
✅ สมัครด้วย Gmail
✅ เลือก Free Plan (M0)
✅ Region: AWS Singapore
```

### 1.2 สร้าง Database User
```
👉 Security → Database Access → Add New Database User
📝 Username: kleara_admin
🔑 Password: (คัดลอกไว้!)
✅ Role: Atlas admin
```

### 1.3 เปิด Network Access
```
👉 Security → Network Access → Add IP Address
✅ เลือก: Allow Access from Anywhere (0.0.0.0/0)
```

### 1.4 คัดลอก Connection String
```
👉 Database → Connect → Connect your application
📋 คัดลอก: mongodb+srv://kleara_admin:<password>@...
⚠️  แทนที่ <password> ด้วย password จริง
✅ เพิ่มชื่อ database: /kleara_clinic ก่อน ?retryWrites

ตัวอย่าง:
mongodb+srv://kleara_admin:MyP@ssw0rd@cluster0.xxxxx.mongodb.net/kleara_clinic?retryWrites=true&w=majority
```

**✅ เสร็จแล้ว! เก็บ Connection String ไว้**

---

## Step 2: Deploy Server บน Vercel (5 นาที)

### 2.1 Login Vercel
```powershell
# เปิด PowerShell
npm install -g vercel
vercel login
```

### 2.2 Deploy Server
```powershell
cd "C:\Clinic System\server"
vercel --prod

# ตอบคำถาม:
? Set up and deploy? → Y
? Which scope? → [เลือกบัญชีของคุณ]
? Link to existing project? → N  
? Project name? → kleara-clinic-server
? In which directory is your code located? → ./
? Override settings? → N
```

### 2.3 ตั้งค่า Environment Variables
```
👉 ไปที่: https://vercel.com/dashboard
👉 คลิก project: kleara-clinic-server
👉 Settings → Environment Variables → Add

เพิ่ม variables เหล่านี้:
```

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://kleara_admin:...` (ตาม Step 1.4) |
| `JWT_SECRET` | `kleara_clinic_production_secret_2025_xyz` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://kleara-clinic.vercel.app` (เดี๋ยวได้จาก Step 3) |

```
✅ คลิก "Save"
👉 Deployments → คลิก "..." → Redeploy
```

### 2.4 ทดสอบ Server
```
👉 เปิด: https://kleara-clinic-server.vercel.app/api/health

ถ้าเห็น:
{
  "status": "OK",
  "message": "Kleara Clinic Management System is running"
}

✅ Server ใช้งานได้แล้ว!
```

---

## Step 3: Deploy Client บน Vercel (5 นาที)

### 3.1 อัพเดท API URL
```powershell
cd "C:\Clinic System\client"
notepad .env.production

# ใส่:
REACT_APP_API_URL=https://kleara-clinic-server.vercel.app/api
REACT_APP_ENV=production
```

### 3.2 Deploy Client
```powershell
vercel --prod

# ตอบคำถาม:
? Set up and deploy? → Y
? Which scope? → [เลือกบัญชีของคุณ]
? Link to existing project? → N
? Project name? → kleara-clinic
? In which directory is your code located? → ./
? Override settings? → Y
  ? Build Command: → npm run build
  ? Output Directory: → build
  ? Development Command: → npm start
```

### 3.3 คัดลอก URL
```
✅ Deploy เสร็จ! จะได้ URL:
👉 https://kleara-clinic.vercel.app
```

### 3.4 อัพเดท FRONTEND_URL ใน Server
```
👉 กลับไปที่ Server Project
👉 Settings → Environment Variables
👉 แก้ FRONTEND_URL เป็น: https://kleara-clinic.vercel.app
👉 Redeploy server
```

---

## Step 4: Initialize Database (2 นาที)

### 4.1 สร้าง Admin User
```
👉 เปิด: https://kleara-clinic.vercel.app
👉 คลิก "Register" (ถ้ามี) หรือใช้ MongoDB Compass
```

**หรือใช้ MongoDB Compass:**
```
1. Download: https://www.mongodb.com/try/download/compass
2. เปิด Compass
3. Connect ด้วย Connection String (Step 1.4)
4. เลือก database: kleara_clinic
5. Create Collection: users
6. Insert Document:
{
  "username": "admin",
  "email": "admin@kleara.clinic",
  "password": "$2b$10$YourHashedPasswordHere",
  "role": "admin",
  "firstName": "Admin",
  "lastName": "User",
  "isActive": true,
  "createdAt": new Date(),
  "updatedAt": new Date()
}
```

**หรือใช้ Terminal:**
```bash
# Connect ด้วย mongosh
mongosh "mongodb+srv://kleara_admin:password@cluster.mongodb.net/kleara_clinic"

# Run init script
use kleara_clinic
load("./server/init-db.js")
```

---

## Step 5: ทดสอบระบบ (2 นาที)

### 5.1 เปิดเว็บไซต์
```
👉 https://kleara-clinic.vercel.app
```

### 5.2 Login
```
Username: admin
Password: admin123
```

### 5.3 ทดสอบ Features
- [ ] Dashboard แสดงข้อมูลได้
- [ ] เพิ่ม Patient ได้
- [ ] สร้าง Appointment ได้
- [ ] ดู Reports ได้
- [ ] ดู Analytics ได้

---

## 🎉 เสร็จสิ้น!

**URLs ของคุณ:**
- 🌐 Frontend: https://kleara-clinic.vercel.app
- ⚙️ Backend: https://kleara-clinic-server.vercel.app
- 🗄️ Database: MongoDB Atlas (kleara_clinic)

**สิ่งที่ควรทำต่อ:**
1. ✅ เปลี่ยน password admin
2. ✅ เพิ่ม staff members
3. ✅ ตั้งค่า services และ products
4. ✅ ทดสอบทุก features
5. ✅ Setup backup schedule (MongoDB Atlas)
6. ✅ เพิ่ม custom domain (ถ้าต้องการ)

---

## 🆘 มีปัญหา?

### ❌ Cannot connect to database
```
✅ ตรวจสอบ MONGODB_URI ใน Environment Variables
✅ ตรวจสอบ password ใน connection string
✅ ตรวจสอบ Network Access (0.0.0.0/0)
```

### ❌ CORS error
```
✅ ตรวจสอบ FRONTEND_URL ใน server environment variables
✅ Redeploy server หลังแก้
```

### ❌ Build failed
```
✅ ตรวจสอบ dependencies ใน package.json
✅ ลอง: cd client && npm install && npm run build
```

### ❌ Function timeout
```
✅ Vercel Free Plan: timeout 10 วินาที
✅ Optimize code หรือ upgrade เป็น Pro Plan
```

---

## 📚 เอกสารเพิ่มเติม

- 📖 **คู่มือ Deploy แบบเต็ม:** [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- 📖 **Integration Guide:** [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- 📖 **Testing Guide:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

## 💰 ค่าใช้จ่าย

**ฟรีทุกอย่าง! (สำหรับเริ่มต้น)**

- ✅ Vercel Free: 100 GB bandwidth/เดือน
- ✅ MongoDB Atlas M0: 512 MB storage (ฟรีตลอดชีพ!)
- ✅ SSL/HTTPS: ฟรี
- ✅ Custom Domain: ฟรี (แต่ต้องซื้อ domain)

**เมื่อโตขึ้น:**
- 💰 Vercel Pro: $20/เดือน (unlimited projects, 1TB bandwidth)
- 💰 MongoDB M10: ~$57/เดือน (10GB storage, dedicated cluster)

---

**🎊 ขอให้ Deploy สำเร็จ!**

ถ้ามีคำถาม ดูที่ [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) หรือ GitHub Issues!
