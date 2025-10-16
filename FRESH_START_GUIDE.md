# 🎯 คู่มือ Deploy ใหม่ทั้งหมด - เริ่มต้นสะอาด

> **เวลา: 30 นาที | ค่าใช้จ่าย: ฟรี 100%**

---

## 📦 สถานะปัจจุบัน

- ✅ Code พร้อม Deploy
- ✅ Vercel CLI ติดตั้งแล้ว
- ✅ Configuration files พร้อม
- 🔄 **กำลังเริ่มต้นใหม่ทั้งหมด**

---

## 🚀 ทำตามทีละขั้นตอน (อย่าข้าม!)

---

## ขั้นที่ 1: Deploy Server (10 นาที)

### คำสั่งที่ต้อง run:
```powershell
cd "C:\Clinic System\server"
vercel --prod
```

### ตอบคำถามแบบนี้:
```
? Set up and deploy...? 
→ yes

? Which scope? 
→ <เลือก account ของคุณ>

? Link to existing project? 
→ no

? What's your project's name? 
→ kleara-clinic-server

? In which directory is your code located? 
→ ./
```

### ✅ คุณจะได้:
```
Production: https://kleara-clinic-server-xxxxx.vercel.app
```

📝 **บันทึก URL นี้ไว้!** เดี๋ยวต้องใช้

---

## ขั้นที่ 2: Deploy Client (10 นาที)

### คำสั่งที่ต้อง run:
```powershell
cd "C:\Clinic System\client"
vercel --prod
```

### ตอบคำถามแบบนี้:
```
? Set up and deploy...? 
→ yes

? Which scope? 
→ <เลือก account เดิม>

? Link to existing project? 
→ no

? What's your project's name? 
→ kleara-clinic-client

? In which directory is your code located? 
→ ./

? Want to modify these settings?
→ no
```

### ✅ คุณจะได้:
```
Production: https://kleara-clinic-client-xxxxx.vercel.app
```

📝 **บันทึก URL นี้ไว้ด้วย!**

---

## ขั้นที่ 3: สร้าง MongoDB Atlas (5 นาที)

### 3.1 สมัครและสร้าง Cluster
1. ไปที่: https://www.mongodb.com/cloud/atlas/register
2. Sign up ด้วย Gmail
3. เลือก **FREE M0 Cluster**
4. เลือก Region: **Singapore**
5. คลิก **Create**

### 3.2 สร้าง User
1. เมนู **Database Access** → **Add New User**
2. Username: `kleara_admin`
3. Password: `Kleara2025!` (เก็บรหัสนี้ไว้!)
4. Role: **Atlas Admin**
5. คลิก **Add User**

### 3.3 เปิด Network Access
1. เมนู **Network Access** → **Add IP Address**
2. คลิก **Allow Access from Anywhere**
3. IP: `0.0.0.0/0`
4. คลิก **Confirm**

### 3.4 คัดลอก Connection String
1. เมนู **Database** → **Connect**
2. เลือก **Connect your application**
3. คัดลอก string แล้ว**แก้ไข**:

```
เดิม:
mongodb+srv://kleara_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

แก้เป็น:
mongodb+srv://kleara_admin:Kleara2025!@cluster0.xxxxx.mongodb.net/kleara_clinic?retryWrites=true&w=majority
```

📝 **เก็บ Connection String นี้ไว้!**

---

## ขั้นที่ 4: ตั้งค่า Environment Variables (5 นาที)

### 4.1 ตั้งค่า SERVER
ไปที่: https://vercel.com/dashboard

1. เลือกโปรเจค **kleara-clinic-server**
2. **Settings** → **Environment Variables**
3. เพิ่มตัวแปรทีละตัว:

```env
MONGODB_URI
mongodb+srv://kleara_admin:Kleara2025!@cluster0.xxxxx.mongodb.net/kleara_clinic?retryWrites=true&w=majority
✓ Production ✓ Preview ✓ Development

JWT_SECRET
kleara-clinic-super-secret-key-2025
✓ Production ✓ Preview ✓ Development

NODE_ENV
production
✓ Production ✓ Preview ✓ Development

FRONTEND_URL
https://kleara-clinic-client-xxxxx.vercel.app
✓ Production ✓ Preview ✓ Development
(ใส่ Client URL จากขั้นที่ 2)

PORT
5002
✓ Production ✓ Preview ✓ Development
```

### 4.2 ตั้งค่า CLIENT
1. เลือกโปรเจค **kleara-clinic-client**
2. **Settings** → **Environment Variables**
3. เพิ่มตัวแปร:

```env
REACT_APP_API_URL
https://kleara-clinic-server-xxxxx.vercel.app/api
✓ Production ✓ Preview ✓ Development
(ใส่ Server URL จากขั้นที่ 1 + /api ต่อท้าย)

REACT_APP_ENV
production
✓ Production ✓ Preview ✓ Development
```

---

## ขั้นที่ 5: Redeploy (3 นาที)

ต้อง redeploy เพื่อให้ environment variables มีผล:

```powershell
# Redeploy Server
cd "C:\Clinic System\server"
vercel --prod

# Redeploy Client
cd "C:\Clinic System\client"
vercel --prod
```

---

## ขั้นที่ 6: Initialize Database (2 นาที)

### 6.1 สร้าง local .env
สร้างไฟล์ `C:\Clinic System\server\.env`:
```env
MONGODB_URI=mongodb+srv://kleara_admin:Kleara2025!@cluster0.xxxxx.mongodb.net/kleara_clinic?retryWrites=true&w=majority
JWT_SECRET=kleara-clinic-super-secret-key-2025
NODE_ENV=development
```

### 6.2 Run Script
```powershell
cd "C:\Clinic System\server"
node init-db.js
```

ต้องเห็น:
```
✅ Connected to MongoDB
✅ Admin user created
✅ Sample data inserted
```

---

## ขั้นที่ 7: ทดสอบ (5 นาที)

1. เปิด: **https://kleara-clinic-client-xxxxx.vercel.app**
2. Login:
   - Username: `admin`
   - Password: `admin123`
3. ทดสอบทุก menu

---

## ✅ เสร็จแล้ว!

หาก Login สำเร็จ + ใช้งานได้:
**🎉 คุณ Deploy สำเร็จแล้ว!**

---

## 🆘 เจอปัญหา?

### ❌ Cannot connect to database
```powershell
# ตรวจสอบ MONGODB_URI
# ดู MongoDB Network Access (ต้องมี 0.0.0.0/0)
```

### ❌ CORS Error
```powershell
# ตรวจสอบ FRONTEND_URL ใน server env
# Redeploy server
```

### ❌ 401 Unauthorized
```powershell
# Run node init-db.js อีกครั้ง
# Clear browser cookies
```

---

## 📝 Summary URLs ของคุณ

หลัง Deploy เสร็จให้บันทึกไว้:

```
Frontend: https://kleara-clinic-client-xxxxx.vercel.app
Backend:  https://kleara-clinic-server-xxxxx.vercel.app
MongoDB:  mongodb+srv://...

Admin Login:
Username: admin
Password: admin123
```

---

**พร้อมเริ่มแล้ว? พิมพ์ "start deploy" เพื่อเริ่มขั้นตอนที่ 1!**
