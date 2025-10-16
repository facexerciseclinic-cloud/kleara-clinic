# 📋 Deployment Checklist

## ✅ ก่อน Deploy

### 1. Code Preparation
- [ ] ทดสอบระบบทุก feature บน localhost
- [ ] แก้ TypeScript errors ทั้งหมด
- [ ] แก้ ESLint warnings (ถ้ามี)
- [ ] ลบ console.log ที่ไม่จำเป็น
- [ ] Comment code ที่สำคัญ
- [ ] Update README.md

### 2. Environment Variables
- [ ] สร้าง `.env.example` สำหรับ server
- [ ] สร้าง `.env.example` สำหรับ client
- [ ] ตรวจสอบ sensitive data ไม่ติด Git
- [ ] เตรียม production values

### 3. Security
- [ ] เปลี่ยน JWT_SECRET เป็น strong password
- [ ] ตั้ง strong MongoDB password
- [ ] ตรวจสอบ CORS settings
- [ ] เปิด HTTPS only
- [ ] จำกัด rate limiting (ถ้าต้องการ)

### 4. Database
- [ ] Backup database เดิม (ถ้ามี)
- [ ] ทดสอบ connection string
- [ ] สร้าง indexes
- [ ] Seed initial data

### 5. Git
- [ ] สร้าง `.gitignore` ครบ
- [ ] Commit ทุก changes
- [ ] Push to GitHub/GitLab (ถ้าใช้)

---

## 🚀 During Deploy

### Step 1: MongoDB Atlas Setup
- [ ] สมัครบัญชี MongoDB Atlas
- [ ] สร้าง Free Cluster (M0)
- [ ] สร้าง Database User
- [ ] เปิด Network Access (0.0.0.0/0)
- [ ] คัดลอก Connection String
- [ ] ทดสอบ connection ด้วย MongoDB Compass

### Step 2: Deploy Server (Backend)
- [ ] สร้าง `vercel.json` ใน /server
- [ ] แก้ `app.js` export สำหรับ Vercel
- [ ] Login Vercel CLI: `vercel login`
- [ ] Deploy: `cd server && vercel --prod`
- [ ] ตั้ง Environment Variables ใน Vercel:
  - [ ] MONGODB_URI
  - [ ] JWT_SECRET
  - [ ] NODE_ENV=production
  - [ ] FRONTEND_URL
  - [ ] (Optional) LINE_CHANNEL_ACCESS_TOKEN
  - [ ] (Optional) GBPRIMEPAY keys
  - [ ] (Optional) SMS_API_KEY
- [ ] Redeploy หลังตั้งค่า env
- [ ] ทดสอบ: `https://your-server.vercel.app/api/health`

### Step 3: Deploy Client (Frontend)
- [ ] สร้าง `.env.production` ใน /client
- [ ] ใส่ `REACT_APP_API_URL=https://your-server.vercel.app/api`
- [ ] Deploy: `cd client && vercel --prod`
- [ ] ตั้ง Environment Variables:
  - [ ] REACT_APP_API_URL
  - [ ] REACT_APP_ENV=production
- [ ] Redeploy
- [ ] ทดสอบ: `https://your-client.vercel.app`

### Step 4: Connect Frontend & Backend
- [ ] คัดลอก Frontend URL
- [ ] อัพเดท `FRONTEND_URL` ใน Server env
- [ ] Redeploy server
- [ ] ทดสอบ CORS (ลอง login)

### Step 5: Initialize Database
- [ ] เชื่อมต่อ MongoDB Compass
- [ ] Run `init-db.js` script
- [ ] สร้าง admin user
- [ ] เพิ่ม sample data (ถ้าต้องการ)

---

## ✅ หลัง Deploy

### 1. Testing
- [ ] เปิดเว็บไซต์ production
- [ ] ทดสอบ Login/Logout
- [ ] ทดสอบ CRUD operations:
  - [ ] Patients
  - [ ] Appointments
  - [ ] Treatments
  - [ ] Billing
  - [ ] Inventory
  - [ ] Staff
- [ ] ทดสอบ Dashboard
- [ ] ทดสอบ Reports
- [ ] ทดสอบ Analytics
- [ ] ทดสอบ Online Booking (ถ้ามี)
- [ ] ทดสอบ Payment Gateway (ถ้ามี)
- [ ] ทดสอบ SMS/LINE (ถ้ามี)
- [ ] ทดสอบ File Upload (ถ้ามี)

### 2. Security
- [ ] Login ครั้งแรกด้วย admin
- [ ] เปลี่ยน password admin ทันที
- [ ] สร้าง staff users
- [ ] ทดสอบ permissions
- [ ] ตรวจสอบ HTTPS (ควรมี padlock)

### 3. Performance
- [ ] ทดสอบ loading speed (< 3 วินาที)
- [ ] ตรวจสอบ Lighthouse score
- [ ] ตรวจสอบ mobile responsiveness
- [ ] ทดสอบบน browsers ต่าง ๆ

### 4. Monitoring
- [ ] Setup Vercel Analytics
- [ ] Setup MongoDB Atlas Monitoring
- [ ] เปิด Email alerts (ถ้าต้องการ)
- [ ] ตรวจสอบ Logs ใน Vercel

### 5. Documentation
- [ ] อัพเดท README.md ด้วย production URLs
- [ ] เขียน User Manual (ถ้าจำเป็น)
- [ ] Document API endpoints
- [ ] บันทึก credentials ไว้ปลอดภัย

### 6. Backup
- [ ] Setup MongoDB Atlas auto-backup
- [ ] Export database ครั้งแรก
- [ ] เก็บ backup ใน Google Drive/Dropbox
- [ ] ตั้ง reminder สำหรับ manual backup (ทุกสัปดาห์)

### 7. Domain (Optional)
- [ ] ซื้อ domain (ถ้าต้องการ)
- [ ] เพิ่ม custom domain ใน Vercel
- [ ] ตั้งค่า DNS (CNAME)
- [ ] รอ SSL certificate (auto)

---

## 📊 Post-Launch

### Week 1
- [ ] ดู Analytics ทุกวัน
- [ ] เก็บ feedback จากผู้ใช้
- [ ] แก้ bugs ที่พบ
- [ ] Monitor server errors

### Week 2-4
- [ ] วิเคราะห์ usage patterns
- [ ] Optimize slow queries
- [ ] เพิ่ม features ตาม feedback
- [ ] Train staff ให้ใช้ระบบ

### Month 2-3
- [ ] ตรวจสอบ performance
- [ ] พิจารณา upgrade plan (ถ้าจำเป็น)
- [ ] เพิ่ม features ใหม่
- [ ] Marketing และโปรโมท

---

## 🆘 Troubleshooting Checklist

### ❌ Cannot connect to database
- [ ] ตรวจสอบ MONGODB_URI
- [ ] ตรวจสอบ password
- [ ] ตรวจสอบ Network Access (0.0.0.0/0)
- [ ] ลอง connect ด้วย MongoDB Compass

### ❌ CORS error
- [ ] ตรวจสอบ FRONTEND_URL ใน server
- [ ] Redeploy server
- [ ] Clear browser cache
- [ ] ลองใน Incognito mode

### ❌ Authentication failed
- [ ] ตรวจสอบ JWT_SECRET
- [ ] ตรวจสอบ user ใน database
- [ ] ลอง register ใหม่
- [ ] Check token expiry

### ❌ Build failed
- [ ] ตรวจสอบ dependencies
- [ ] `npm install` ใหม่
- [ ] ลบ `node_modules` แล้ว install ใหม่
- [ ] ตรวจสอบ TypeScript errors

### ❌ Function timeout
- [ ] Optimize slow queries
- [ ] เพิ่ม indexes ใน MongoDB
- [ ] พิจารณา upgrade Vercel plan
- [ ] Split long-running tasks

### ❌ File upload failed
- [ ] ตรวจสอบ STORAGE_PROVIDER setting
- [ ] ตรวจสอบ AWS/GCS credentials
- [ ] ตรวจสอบ file size limit
- [ ] ตรวจสอบ multer configuration

---

## 💰 Cost Monitoring

### Free Tier Limits
**Vercel:**
- [ ] Bandwidth: 100 GB/month (เช็คใน Dashboard)
- [ ] Function Executions: 100 GB-Hours
- [ ] Build Time: 100 hours

**MongoDB Atlas M0:**
- [ ] Storage: 512 MB (เช็คใน Atlas)
- [ ] Connections: 500 concurrent

### When to Upgrade
- [ ] Vercel > 80 GB bandwidth/month → Upgrade to Pro
- [ ] MongoDB > 400 MB → Upgrade to M10
- [ ] Function timeouts → Upgrade Vercel
- [ ] Need more connections → Upgrade MongoDB

---

## 📝 Maintenance Schedule

### Daily
- [ ] ตรวจสอบ errors ใน Vercel logs
- [ ] ดู MongoDB performance metrics

### Weekly
- [ ] Review analytics
- [ ] Check backup status
- [ ] Update dependencies (ถ้ามี security patches)

### Monthly
- [ ] Full database backup
- [ ] Review cost/usage
- [ ] Performance optimization
- [ ] Security audit

### Quarterly
- [ ] Major updates
- [ ] Feature additions
- [ ] User feedback review
- [ ] Database cleanup (ลบข้อมูลเก่า)

---

## ✅ Success Criteria

### Launch Success
- [ ] Website accessible 24/7
- [ ] No critical errors
- [ ] All features working
- [ ] Users can login
- [ ] Data persists correctly

### Performance Success
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] Uptime > 99%
- [ ] No timeout errors

### Business Success
- [ ] Staff trained
- [ ] Data migrated (ถ้ามี)
- [ ] Workflow improved
- [ ] Users satisfied

---

**🎉 Congratulations! Your clinic system is live!**

📞 Support: Check [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed guide
