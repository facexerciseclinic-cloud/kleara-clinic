# 🚀 Vercel Deployment Guide - Kleara Clinic Management System

## 📋 สารบัญ
1. [เตรียมโปรเจค](#1-เตรียมโปรเจค)
2. [Setup MongoDB Atlas](#2-setup-mongodb-atlas)
3. [Deploy Backend (Server) บน Vercel](#3-deploy-backend-server-บน-vercel)
4. [Deploy Frontend (Client) บน Vercel](#4-deploy-frontend-client-บน-vercel)
5. [เชื่อมต่อ Frontend กับ Backend](#5-เชื่อมต่อ-frontend-กับ-backend)
6. [ทดสอบระบบ](#6-ทดสอบระบบ)

---

## 1. เตรียมโปรเจค

### 1.1 สร้าง Git Repository

```bash
# เปิด PowerShell ที่โฟลเดอร์ Clinic System
cd "C:\Clinic System"

# Initialize Git
git init

# สร้าง .gitignore
```

### 1.2 สร้างไฟล์ .gitignore

```gitignore
# Dependencies
node_modules/
package-lock.json
client/node_modules/
server/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
server/.env
client/.env

# Build outputs
client/build/
dist/
*.log

# OS
.DS_Store
Thumbs.db
```

---

## 2. Setup MongoDB Atlas (Database ฟรี!)

### 2.1 สร้างบัญชี MongoDB Atlas

1. **ไปที่:** https://www.mongodb.com/cloud/atlas/register
2. **สมัครสมาชิก** (ใช้ Gmail ก็ได้)
3. **เลือก Free Plan (M0)** - ฟรีตลอดชีพ!

### 2.2 สร้าง Cluster

1. **คลิก "Build a Database"**
2. **เลือก FREE (M0)** ที่ AWS Singapore หรือ Mumbai (ใกล้ไทย)
3. **ตั้งชื่อ Cluster:** `kleara-clinic` หรืออะไรก็ได้
4. **คลิก "Create"** รอสักครู่

### 2.3 ตั้งค่า Security

#### **A. Database Access (สร้าง User)**
1. ไปที่เมนู **"Security" → "Database Access"**
2. คลิก **"Add New Database User"**
3. **Authentication Method:** Password
   - Username: `kleara_admin`
   - Password: **สร้าง password แข็งแรง** (กด "Autogenerate Secure Password")
   - **⚠️ เก็บ password ไว้! จะต้องใช้**
4. **Database User Privileges:** Read and write to any database
5. คลิก **"Add User"**

#### **B. Network Access (เปิด IP)**
1. ไปที่เมนู **"Security" → "Network Access"**
2. คลิก **"Add IP Address"**
3. คลิก **"Allow Access from Anywhere"** (0.0.0.0/0)
   - **หมายเหตุ:** สำหรับ production ควรจำกัด IP ของ Vercel
4. คลิก **"Confirm"**

### 2.4 เชื่อมต่อ Database

1. กลับไปที่ **"Database"** (เมนูซ้าย)
2. คลิกปุ่ม **"Connect"** ที่ Cluster ของคุณ
3. เลือก **"Connect your application"**
4. **Driver:** Node.js, **Version:** 4.1 or later
5. **คัดลอก Connection String:**
   ```
   mongodb+srv://kleara_admin:<password>@kleara-clinic.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **แทนที่ `<password>`** ด้วย password จริง
7. **เพิ่มชื่อ database ท้าย URL:**
   ```
   mongodb+srv://kleara_admin:YOUR_PASSWORD@kleara-clinic.xxxxx.mongodb.net/kleara_clinic?retryWrites=true&w=majority
   ```

**✅ เก็บ Connection String นี้ไว้!**

---

## 3. Deploy Backend (Server) บน Vercel

### 3.1 สร้าง vercel.json สำหรับ Server

สร้างไฟล์ `server/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3.2 อัพเดท app.js สำหรับ Vercel

เพิ่มบรรทัดนี้ท้ายไฟล์ `server/app.js`:

```javascript
// Export for Vercel serverless
module.exports = app;
```

### 3.3 Deploy Server

#### **A. ผ่าน Vercel CLI (วิธีง่าย)**

```bash
# ติดตั้ง Vercel CLI
npm install -g vercel

# ไปที่โฟลเดอร์ server
cd "C:\Clinic System\server"

# Login Vercel (ครั้งแรก)
vercel login

# Deploy
vercel

# ตอบคำถาม:
# - Set up and deploy? → Yes
# - Which scope? → [เลือกบัญชีของคุณ]
# - Link to existing project? → No
# - Project name? → kleara-clinic-server
# - In which directory is your code located? → ./
# - Override settings? → No
```

#### **B. ผ่าน Vercel Website**

1. **ไปที่:** https://vercel.com/login
2. **Login** ด้วย GitHub, GitLab, หรือ Email
3. **คลิก "Add New..." → Project**
4. **Import Git Repository** หรือ **Upload ไฟล์**
5. **Root Directory:** เลือก `server`
6. **Framework Preset:** Other
7. **Build Command:** (ว่างไว้)
8. **Output Directory:** (ว่างไว้)
9. **Install Command:** `npm install`

### 3.4 ตั้งค่า Environment Variables (สำคัญ!)

ใน Vercel Project Settings → **Environment Variables** เพิ่ม:

```env
# Database
MONGODB_URI=mongodb+srv://kleara_admin:YOUR_PASSWORD@kleara-clinic.xxxxx.mongodb.net/kleara_clinic?retryWrites=true&w=majority

# JWT Secret (สร้าง secret แข็งแรง)
JWT_SECRET=kleara_clinic_super_secret_key_2025_production_xyz123

# Node Environment
NODE_ENV=production

# Port (Vercel จัดการเอง แต่เพิ่มไว้)
PORT=5002

# CORS (เดี๋ยวจะใส่ URL frontend)
FRONTEND_URL=https://your-frontend-app.vercel.app

# LINE API (ถ้ามี)
LINE_CHANNEL_ACCESS_TOKEN=your_line_token_here
LINE_CHANNEL_SECRET=your_line_secret_here

# Payment Gateway (ถ้ามี)
GBPRIMEPAY_PUBLIC_KEY=your_gbprimepay_public_key
GBPRIMEPAY_SECRET_KEY=your_gbprimepay_secret_key
GBPRIMEPAY_MERCHANT_ID=your_merchant_id

# SMS API (ถ้ามี)
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_secret

# Storage (ถ้าใช้ AWS S3)
STORAGE_PROVIDER=local
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=kleara-clinic-files
```

### 3.5 คลิก "Deploy"

**รอสักครู่** → จะได้ URL เช่น: `https://kleara-clinic-server.vercel.app`

**✅ ทดสอบ API:**
- เปิด: `https://kleara-clinic-server.vercel.app/api/health`
- ควรเห็น: `{"status":"OK","message":"Kleara Clinic Management System is running"}`

---

## 4. Deploy Frontend (Client) บน Vercel

### 4.1 สร้าง Environment Variables

สร้างไฟล์ `client/.env.production`:

```env
REACT_APP_API_URL=https://kleara-clinic-server.vercel.app/api
REACT_APP_ENV=production
```

### 4.2 อัพเดท package.json

ตรวจสอบว่า `client/package.json` มี build script:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### 4.3 Deploy Client

#### **A. ผ่าน Vercel CLI**

```bash
# ไปที่โฟลเดอร์ client
cd "C:\Clinic System\client"

# Deploy
vercel

# ตอบคำถาม:
# - Set up and deploy? → Yes
# - Project name? → kleara-clinic-frontend
# - In which directory is your code located? → ./
# - Override settings? → Yes
#   - Build Command: npm run build
#   - Output Directory: build
#   - Development Command: npm start
```

#### **B. ผ่าน Vercel Website**

1. **คลิก "Add New..." → Project**
2. **Import Git Repository** หรือ Upload
3. **Root Directory:** เลือก `client`
4. **Framework Preset:** Create React App
5. **Build Command:** `npm run build`
6. **Output Directory:** `build`
7. **Install Command:** `npm install`

### 4.4 ตั้งค่า Environment Variables

ใน Vercel Project Settings → **Environment Variables**:

```env
REACT_APP_API_URL=https://kleara-clinic-server.vercel.app/api
REACT_APP_ENV=production
```

### 4.5 คลิก "Deploy"

**รอสักครู่** → จะได้ URL เช่น: `https://kleara-clinic.vercel.app`

---

## 5. เชื่อมต่อ Frontend กับ Backend

### 5.1 อัพเดท CORS ใน Backend

กลับไปที่ **Server Project** → **Environment Variables** แก้:

```env
FRONTEND_URL=https://kleara-clinic.vercel.app
```

### 5.2 Redeploy Server

ใน Vercel Dashboard → Server Project → **Deployments** → คลิก "..." → **Redeploy**

### 5.3 ตรวจสอบ CORS ใน app.js

ไฟล์ `server/app.js` ควรมี:

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 6. ทดสอบระบบ

### 6.1 เปิดเว็บไซต์

เปิด: `https://kleara-clinic.vercel.app`

### 6.2 ทดสอบ Login

1. กรอก Username/Password
2. ถ้า Login สำเร็จ → **ระบบพร้อมใช้งาน!** 🎉

### 6.3 ทดสอบ API Endpoints

```bash
# Health Check
curl https://kleara-clinic-server.vercel.app/api/health

# Patients (ต้อง login ก่อน)
curl https://kleara-clinic-server.vercel.app/api/patients

# Analytics
curl https://kleara-clinic-server.vercel.app/api/analytics/dashboard
```

---

## 7. การอัพเดทระบบ (CI/CD)

### 7.1 วิธีที่ 1: ผ่าน Vercel CLI

```bash
# อัพเดท server
cd "C:\Clinic System\server"
vercel --prod

# อัพเดท client
cd "C:\Clinic System\client"
vercel --prod
```

### 7.2 วิธีที่ 2: ผ่าน Git (แนะนำ)

```bash
# Commit changes
cd "C:\Clinic System"
git add .
git commit -m "Update clinic system"

# Push to GitHub
git push origin main

# Vercel จะ auto-deploy เมื่อมี push ไปที่ main branch
```

### 7.3 Setup Git Integration

1. **ใน Vercel Dashboard** → Project Settings → Git
2. **Connect Git Repository** (GitHub/GitLab/Bitbucket)
3. **เลือก branch** ที่จะ auto-deploy (เช่น `main`)
4. **ตั้งค่า:**
   - Production Branch: `main`
   - Preview Branches: All branches
   - Install Vercel GitHub App

---

## 8. Custom Domain (ถ้าต้องการ)

### 8.1 เพิ่ม Domain

1. **Vercel Dashboard** → Project → **Settings** → **Domains**
2. **คลิก "Add"** → ใส่ domain ของคุณ (เช่น `clinic.yourdomain.com`)
3. **ตั้งค่า DNS** ที่ผู้ให้บริการ domain:
   ```
   Type: CNAME
   Name: clinic
   Value: cname.vercel-dns.com
   ```
4. **รอ DNS propagate** (5-30 นาที)
5. **SSL Certificate** จะถูกสร้างอัตโนมัติ (HTTPS ฟรี!)

---

## 9. Monitoring & Logs

### 9.1 ดู Logs

1. **Vercel Dashboard** → Project → **Deployments**
2. **คลิกที่ Deployment** ล่าสุด
3. **คลิก "View Function Logs"**

### 9.2 ดู Analytics

1. **Vercel Dashboard** → Project → **Analytics**
2. เห็น:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### 9.3 ดู Database

1. **MongoDB Atlas** → **Database** → **Browse Collections**
2. เห็นข้อมูลทั้งหมด:
   - users
   - patients
   - appointments
   - treatments
   - bills
   - packages

---

## 10. Troubleshooting

### ❌ Error: "Cannot connect to database"

**แก้ไข:**
1. ตรวจสอบ `MONGODB_URI` ใน Environment Variables
2. ตรวจสอบ password ใน connection string
3. ตรวจสอบ Network Access ใน MongoDB Atlas (ต้องเปิด 0.0.0.0/0)

### ❌ Error: "CORS policy"

**แก้ไข:**
1. ตรวจสอบ `FRONTEND_URL` ใน server environment variables
2. Redeploy server หลังแก้ environment variables

### ❌ Error: "Module not found"

**แก้ไข:**
1. ตรวจสอบ `package.json` มี dependencies ครบ
2. Redeploy project

### ❌ Error: "Function timeout"

**แก้ไข:**
1. Vercel Free Plan มี timeout 10 วินาที
2. Upgrade เป็น Pro Plan ($20/เดือน) สำหรับ timeout 60 วินาที
3. หรือ optimize code ให้เร็วขึ้น

---

## 11. เปรียบเทียบ Database Options

### MongoDB Atlas (แนะนำ! ⭐)

**✅ ข้อดี:**
- ✅ **ฟรีตลอดชีพ!** (M0 Cluster: 512 MB storage)
- ✅ เหมาะกับ Node.js + Express (Mongoose)
- ✅ มี Schema flexibility
- ✅ Query ซับซ้อนได้ (aggregation, joins)
- ✅ Backup อัตโนมัติ
- ✅ Scale ได้ง่าย
- ✅ มี GUI (MongoDB Compass) จัดการง่าย

**❌ ข้อเสีย:**
- ❌ ต้องเรียนรู้ MongoDB Query Language (แต่ไม่ยาก!)

### Firebase/Firestore

**✅ ข้อดี:**
- ✅ Setup ง่ายมาก
- ✅ Real-time updates
- ✅ มี Authentication built-in

**❌ ข้อเสีย:**
- ❌ **ไม่ค่อยเหมาะกับ Express Server** (ออกแบบสำหรับ client-side)
- ❌ Query จำกัด (ไม่มี JOIN, aggregate ซับซ้อน)
- ❌ ราคาแพงถ้าใช้เยอะ (ค่า read/write)
- ❌ ต้องเปลี่ยน code เยอะ (เพราะระบบใช้ Mongoose)

### Supabase (PostgreSQL)

**✅ ข้อดี:**
- ✅ ฟรีก็ใช้ได้
- ✅ SQL Database (PostgreSQL)
- ✅ มี REST API auto-generated

**❌ ข้อเสีย:**
- ❌ ต้องเปลี่ยนจาก Mongoose เป็น Sequelize/TypeORM
- ❌ ต้องเขียน SQL Schema
- ❌ ต้อง refactor code เยอะ

**🎯 สรุป: ใช้ MongoDB Atlas เพราะ:**
- ระบบเราใช้ Mongoose อยู่แล้ว
- ไม่ต้องเปลี่ยน code
- ฟรีและเพียงพอ
- Scale ได้ในอนาคต

---

## 12. ราคา & Limitations

### Vercel (Free Tier)

**✅ ฟรีได้:**
- ✅ Deployments: Unlimited
- ✅ Bandwidth: 100 GB/เดือน
- ✅ Serverless Function Executions: 100 GB-Hours
- ✅ Build Time: 100 Hours/เดือน
- ✅ SSL/HTTPS: ฟรี
- ✅ Custom Domain: ได้ (ต้องซื้อ domain เอง)

**⚠️ ข้อจำกัด:**
- ⚠️ Function Timeout: 10 วินาที
- ⚠️ Function Size: 50 MB

**💰 Pro Plan ($20/เดือน):**
- Function Timeout: 60 วินาที
- Bandwidth: 1 TB/เดือน
- Priority support

### MongoDB Atlas (Free Tier M0)

**✅ ฟรีได้:**
- ✅ Storage: 512 MB
- ✅ RAM: Shared
- ✅ Backup: ทุก 24 ชั่วโมง
- ✅ Bandwidth: Unlimited

**⚠️ ข้อจำกัด:**
- ⚠️ 1 Cluster ต่อ 1 Project
- ⚠️ Performance จำกัด (shared cluster)

**💰 M10 Plan ($0.08/ชั่วโมง หรือ ~$57/เดือน):**
- Storage: 10-4096 GB
- RAM: Dedicated 2-64 GB
- Auto-scaling
- Performance monitoring

---

## 13. Production Checklist

### ก่อน Deploy

- [ ] ทดสอบทุก API endpoint
- [ ] ตรวจสอบ error handling
- [ ] ตั้ง Environment Variables ครบ
- [ ] Enable CORS ถูกต้อง
- [ ] ตั้ง JWT Secret แข็งแรง
- [ ] Backup Database เก่า (ถ้ามี)

### หลัง Deploy

- [ ] ทดสอบ Login/Logout
- [ ] ทดสอบ CRUD operations
- [ ] ทดสอบ File Upload (ถ้ามี)
- [ ] ทดสอบ Payment Gateway (ถ้ามี)
- [ ] ทดสอบ LINE API (ถ้ามี)
- [ ] ทดสอบ SMS (ถ้ามี)
- [ ] ตั้ง Monitoring/Alerts
- [ ] Backup Database schedule

### Security

- [ ] เปลี่ยน default passwords
- [ ] ตั้ง strong JWT secret
- [ ] จำกัด Network Access (MongoDB)
- [ ] Enable HTTPS (Vercel ทำให้อัตโนมัติ)
- [ ] ตั้ง rate limiting (ถ้าต้องการ)
- [ ] Hide API keys/secrets

---

## 14. Quick Commands Reference

```bash
# ===========================================
# DEPLOY COMMANDS
# ===========================================

# Login Vercel (ครั้งแรก)
vercel login

# Deploy Server
cd "C:\Clinic System\server"
vercel --prod

# Deploy Client
cd "C:\Clinic System\client"
vercel --prod

# ===========================================
# GIT COMMANDS
# ===========================================

# Initialize Git
cd "C:\Clinic System"
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (GitHub)
git remote add origin https://github.com/YOUR_USERNAME/kleara-clinic.git

# Push to GitHub
git push -u origin main

# ===========================================
# DATABASE COMMANDS
# ===========================================

# Connect MongoDB (local)
mongosh "mongodb://localhost:27017/kleara_clinic"

# Connect MongoDB Atlas
mongosh "mongodb+srv://username:password@cluster.xxxxx.mongodb.net/kleara_clinic"

# Backup Database
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore Database
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## 15. Next Steps

### 🎯 หลัง Deploy สำเร็จ

1. **ทดสอบระบบ** ให้ครบทุก feature
2. **เพิ่ม sample data** สำหรับ demo
3. **Setup monitoring** (Vercel Analytics, MongoDB Atlas monitoring)
4. **Create admin user** ครั้งแรก
5. **Document API** สำหรับทีม
6. **Setup backup schedule** (MongoDB Atlas Backup)
7. **Consider Custom Domain** (ถ้าต้องการ)
8. **Setup Email alerts** สำหรับ errors
9. **Performance optimization** (ถ้าจำเป็น)
10. **Security audit** (ตรวจสอบ vulnerabilities)

### 🚀 Scale ในอนาคต

เมื่อระบบโตขึ้น พิจารณา:
- Upgrade Vercel เป็น Pro ($20/เดือน)
- Upgrade MongoDB Atlas เป็น M10+ ($57/เดือน)
- ใช้ CDN สำหรับ static files
- Setup Redis สำหรับ caching
- Setup Load Balancer (ถ้ามี traffic เยอะมาก)
- Microservices architecture (แยก services)

---

## 📞 Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **Node.js Docs:** https://nodejs.org/docs/
- **Express Docs:** https://expressjs.com/
- **React Docs:** https://react.dev/

---

**🎉 ขอให้ Deploy สำเร็จ!**

ถ้ามีปัญหาหรือข้อสงสัย สามารถดูที่ [Troubleshooting](#10-troubleshooting) หรือติดต่อทีมพัฒนาได้เลย!
