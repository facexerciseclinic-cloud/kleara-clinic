# 🚀 คู่มือ Deploy ระบบ Kleara Clinic Management

## 📋 สารบัญ
1. [การรันระบบแบบ Development](#1-การรันระบบแบบ-development)
2. [การทดสอบระบบ](#2-การทดสอบระบบ)
3. [การ Deploy แบบ Production](#3-การ-deploy-แบบ-production)
4. [การแก้ไขปัญหาที่พบบ่อย](#4-การแก้ไขปัญหาที่พบบ่อย)

---

## 1. การรันระบบแบบ Development

### ✅ สิ่งที่ต้องเตรียม
- Node.js (เวอร์ชัน 16 ขึ้นไป) - [ดาวน์โหลด](https://nodejs.org/)
- MongoDB (หรือใช้ MongoDB Atlas ฟรี) - [ดาวน์โหลด](https://www.mongodb.com/try/download/community)
- Git (ถ้าต้องการ) - [ดาวน์โหลด](https://git-scm.com/downloads)

### 📝 ขั้นตอนที่ 1: ตั้งค่า Database (MongoDB)

#### **วิธีที่ 1: ใช้ MongoDB บนเครื่อง**
1. ติดตั้ง MongoDB Community Edition
2. เปิด MongoDB Compass (มากับตัวติดตั้ง)
3. เชื่อมต่อไปที่ `mongodb://localhost:27017`
4. สร้าง Database ชื่อ `kleara_clinic`

#### **วิธีที่ 2: ใช้ MongoDB Atlas (แนะนำ - ฟรี)**
1. ไปที่ https://www.mongodb.com/cloud/atlas/register
2. สร้างบัญชีฟรี
3. สร้าง Cluster แบบฟรี (M0)
4. ใน Security → Database Access: สร้าง user และ password
5. ใน Security → Network Access: เพิ่ม IP Address `0.0.0.0/0` (Allow from anywhere)
6. คัดลอก Connection String (จะได้ประมาณ):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kleara_clinic
   ```

### 📝 ขั้นตอนที่ 2: ตั้งค่า Backend (Server)

1. เปิด **PowerShell** หรือ **Command Prompt**
2. ไปที่โฟลเดอร์ server:
   ```powershell
   cd "c:\Clinic System\server"
   ```

3. สร้างไฟล์ `.env` (ถ้ายังไม่มี):
   ```powershell
   notepad .env
   ```

4. ใส่ข้อมูลใน `.env`:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/kleara_clinic
   # หรือถ้าใช้ Atlas:
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kleara_clinic

   # JWT Secret (ใช้สำหรับ authentication)
   JWT_SECRET=kleara-clinic-super-secret-key-2024

   # Port
   PORT=5000

   # Environment
   NODE_ENV=development
   ```

5. ติดตั้ง packages:
   ```powershell
   npm install
   ```

6. รัน Backend Server:
   ```powershell
   node app.js
   ```

   **ถ้าเห็นข้อความ:**
   ```
   🚀 Server running on port 5000
   ✅ MongoDB Connected Successfully
   ```
   แสดงว่าสำเร็จ! ✅

### 📝 ขั้นตอนที่ 3: ตั้งค่า Frontend (Client)

1. เปิด **PowerShell หน้าต่างใหม่** (แยกจาก Server)
2. ไปที่โฟลเดอร์ client:
   ```powershell
   cd "c:\Clinic System\client"
   ```

3. ติดตั้ง packages:
   ```powershell
   npm install
   ```

4. รัน Frontend:
   ```powershell
   npm start
   ```

5. เว็บจะเปิดอัตโนมัติที่ `http://localhost:3000`

### 🎯 ทดสอบ Login
- **Username**: `admin`
- **Password**: `admin123`

---

## 2. การทดสอบระบบ

### ✅ ฟีเจอร์ที่ต้องทดสอบ

#### 📦 Inventory (สินค้าคงคลัง)
- [ ] เพิ่มสินค้าใหม่
- [ ] แก้ไขสินค้า
- [ ] รับสินค้าเข้า (Stock-in)
- [ ] เบิกสินค้า (Stock-out)
- [ ] ดูรายงานสินค้า
- [ ] สร้างใบสั่งซื้อ

#### 👥 Staff (บุคลากร)
- [ ] เพิ่มพนักงาน
- [ ] แก้ไขข้อมูลพนักงาน
- [ ] จัดตารางงาน
- [ ] จัดการสิทธิ์
- [ ] ประเมินผลงาน

#### 👤 Patients (ผู้ป่วย)
- [ ] เพิ่มผู้ป่วยใหม่
- [ ] แก้ไขข้อมูลผู้ป่วย
- [ ] ค้นหาผู้ป่วย

---

## 3. การ Deploy แบบ Production

### 🎯 ตัวเลือกในการ Deploy

#### **ตัวเลือกที่ 1: Deploy บน VPS (Virtual Private Server)**
**เหมาะสำหรับ:** ธุรกิจขนาดกลาง-ใหญ่, ต้องการควบคุมเต็มที่

**ผู้ให้บริการแนะนำ:**
- **DigitalOcean** - เริ่มต้น $6/เดือน
- **Linode** - เริ่มต้น $5/เดือน
- **AWS EC2** - มีแพ็กเกจฟรี 1 ปี
- **Google Cloud** - มี Credit ฟรี $300

**ขั้นตอนการ Deploy บน Ubuntu VPS:**

1. **เชื่อมต่อกับ Server**
   ```bash
   ssh root@your-server-ip
   ```

2. **ติดตั้ง Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **ติดตั้ง MongoDB**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. **ติดตั้ง PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   ```

5. **Upload โค้ด** (ใช้ FileZilla หรือ SCP)
   ```bash
   # บนเครื่องคุณ (Windows)
   scp -r "c:\Clinic System" root@your-server-ip:/var/www/
   ```

6. **ติดตั้ง Dependencies**
   ```bash
   cd /var/www/Clinic\ System/server
   npm install --production
   
   cd /var/www/Clinic\ System/client
   npm install
   npm run build
   ```

7. **ตั้งค่า Environment Variables**
   ```bash
   cd /var/www/Clinic\ System/server
   nano .env
   ```
   
   ```env
   MONGODB_URI=mongodb://localhost:27017/kleara_clinic
   JWT_SECRET=your-super-secret-production-key-here
   PORT=5000
   NODE_ENV=production
   ```

      ### ค่าตัวแปรสำคัญเพิ่มเติม (สำหรับระบบ authentication)

      ```env
      # secret สำหรับ access tokens
      JWT_SECRET=your-production-jwt-secret

      # secret สำหรับ refresh tokens (ต้องเก็บเป็นความลับ)
      REFRESH_TOKEN_SECRET=your-production-refresh-secret

      # URL ของ frontend ใช้สำหรับ CORS
      FRONTEND_URL=https://your-frontend-domain.example
      ```

      หมายเหตุ:
      - ระบบใช้ httpOnly cookie ชื่อ `refreshToken` สำหรับเก็บ refresh token ในเบราว์เซอร์
      - ถ้าคุณเปิด "Deployment Protection" บน Vercel (หรือ SSO), การเรียก API อัตโนมัติจากสคริปต์จะถูกบล็อกจนกว่าจะให้ bypass token หรือยืนยัน SSO
         - ในการทดสอบ CI ให้ใช้ preview deployment หรือปิด protection ชั่วคราว

   ## Vercel Deployment Protection / SSO

   ถ้าคุณเปิดการป้องกันการ deploy (Deployment Protection) หรือ SSO บน Vercel โปรดทราบว่า:

   - หน้าและ API ของ deployment จะตอบด้วย 401 สำหรับคำขอที่ไม่มีการยืนยัน (เช่น สคริปต์อัตโนมัติ)
   - วิธีการแก้ไขเพื่อทดสอบ/เข้าถึงแบบอัตโนมัติ:
      1. ชั่วคราวปิด Deployment Protection ใน Vercel project settings (Settings → Security → Protect Production Deployments) ขณะที่ทดสอบ
      2. หรือสร้าง Preview Deployment ที่ไม่เปิด Protection และทดสอบบน Preview URL
      3. ถ้าต้องการให้สคริปต์เข้าถึง production ที่ถูกป้องกัน คุณต้องใช้ "bypass token" ของ Vercel ตามเอกสารของ Vercel (ดูลิงก์ด้านล่าง)

   คู่มือการขอ bypass token / automation:
   - https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation

   หมายเหตุด้านความปลอดภัย: หากคุณมอบ bypass token ให้ผู้อื่น ให้แน่ใจว่าเป็น token ชั่วคราวและลบทันทีหลังการทดสอบ

   ## Admin endpoints สำหรับจัดการ Refresh Tokens

   ระบบมี endpoints พื้นฐานสำหรับผู้ดูแลระบบเพื่อดูและเพิกถอน refresh tokens:

   - GET /api/auth/refresh-tokens — คืนรายการ refresh token ล่าสุด (ต้องเป็น admin)
   - DELETE /api/auth/refresh-tokens/:jti — เพิกถอน refresh token ตาม jti (ต้องเป็น admin)

   การใช้งานตัวอย่าง (curl, ต้องมี Authorization header ของผู้ใช้ admin):

   ```bash
   # รับรายการ token
   curl -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" https://your-server.example/api/auth/refresh-tokens

   # เพิกถอน token
   curl -X DELETE -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" https://your-server.example/api/auth/refresh-tokens/<JTI>
   ```

   ถ้าคุณต้องการ UI สำหรับผู้ดูแล (ใน client) ให้แจ้งผมได้ ผมจะเพิ่มหน้า Manage Sessions ที่เรียก API เหล่านี้

   ## วิธีทดสอบ Auth (login / refresh / logout) แบบมือ

   ต่อไปนี้เป็นชุดคำสั่ง PowerShell ที่คุณสามารถรันจากเครื่องของคุณเพื่อทดสอบ flow ทั้งหมด (จะใช้งานได้เมื่อ deployment ไม่ถูกป้องกัน หรือเมื่อคุณมี bypass token / cookie SSO ที่ถูกต้อง):

   ```powershell
   # สร้าง session object เพื่อเก็บ cookie
   $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

   # 1) Login (จะเซ็ต httpOnly refresh cookie)
   Invoke-RestMethod -Method Post -Uri 'https://<YOUR_SERVER>/api/auth/login' -ContentType 'application/json' -Body '{"username":"admin","password":"admin123"}' -WebSession $session | ConvertTo-Json -Depth 6 | Out-File login_response.json

   # 2) Refresh (ใช้ cookie ที่ได้จาก login)
   Invoke-RestMethod -Method Post -Uri 'https://<YOUR_SERVER>/api/auth/refresh' -WebSession $session -ContentType 'application/json' | ConvertTo-Json -Depth 6 | Out-File refresh_response.json

   # 3) Logout (จะลบ cookie และเพิกถอน token ใน DB)
   Invoke-RestMethod -Method Post -Uri 'https://<YOUR_SERVER>/api/auth/logout' -WebSession $session -ContentType 'application/json' | ConvertTo-Json -Depth 6 | Out-File logout_response.json

   # 4) ตรวจสอบว่า refresh หลัง logout ล้มเหลว (คาดว่าจะได้รับ 401)
   try { Invoke-RestMethod -Method Post -Uri 'https://<YOUR_SERVER>/api/auth/refresh' -WebSession $session -ContentType 'application/json' } catch { Write-Host 'Expected failure after logout:' $_.Exception.Message }
   ```

   บันทึก: ถ้าการเรียกเหล่านี้คืนค่า 401 ที่ระดับ Vercel ก่อนที่จะมาถึงแอป นั่นหมายความว่า Deployment Protection กำลังป้องกันการเข้าถึง — ให้ปิด protection ชั่วคราวหรือใช้ bypass token.

   ## Bypass token (Vercel) — สรุปคร่าว ๆ

   1. อ่านเอกสาร Vercel สำหรับการสร้าง bypass token สำหรับ automation:
      https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
   2. เมื่อได้ token แล้ว คุณสามารถเรียก URL ในรูปแบบ:
      https://<DEPLOYMENT_URL>?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=<BYPASS_TOKEN>
      ซึ่งจะเซ็ต cookie ของ Vercel ที่จำเป็นให้สคริปต์ต่อไปสามารถเข้าถึง API ได้ชั่วคราว
   3. ความปลอดภัย: ให้สร้าง token ชั่วคราวและลบทันทีหลังการทดสอบ

   ## Production checklist (quick)
   - ตรวจสอบว่า `JWT_SECRET` และ `REFRESH_TOKEN_SECRET` ถูกตั้งค่าใน dashboard ของผู้ให้บริการ (Vercel / Heroku / VPS)
   - ตั้ง `FRONTEND_URL` ให้ตรงกับ domain ของ frontend เพื่อให้ CORS ถูกต้อง
   - ใช้ MongoDB Atlas (ไม่แนะนำ local Mongo ใน production)
   - ตรวจสอบว่า `cookie` policy (SameSite / Secure) ถูกตั้งค่าเหมาะสมสำหรับ environment
   - ตรวจสอบว่า Deployment Protection ถูกตั้งค่าตามนโยบายองค์กร แต่มีช่องทางสำหรับ automation/CI

8. **รัน Backend ด้วย PM2**
   ```bash
   cd /var/www/Clinic\ System/server
   pm2 start app.js --name kleara-backend
   pm2 save
   pm2 startup
   ```

9. **ติดตั้ง Nginx (Web Server)**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/kleara
   ```

   ใส่ config:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /var/www/Clinic\ System/client/build;
           try_files $uri /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   เปิดใช้งาน:
   ```bash
   sudo ln -s /etc/nginx/sites-available/kleara /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **ติดตั้ง SSL Certificate (HTTPS)** - ฟรีจาก Let's Encrypt
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

---

#### **ตัวเลือกที่ 2: Deploy บน Heroku (แนะนำสำหรับผู้เริ่มต้น)**
**เหมาะสำหรับ:** ทดสอบ, Startup, ไม่ต้องการจัดการ Server เอง

**ขั้นตอน:**

1. **สร้างบัญชี Heroku**
   - ไปที่ https://signup.heroku.com/
   - สมัครฟรี

2. **ติดตั้ง Heroku CLI**
   - ดาวน์โหลดจาก: https://devcenter.heroku.com/articles/heroku-cli

3. **Login Heroku**
   ```powershell
   heroku login
   ```

4. **Deploy Backend**
   ```powershell
   cd "c:\Clinic System\server"
   
   # สร้าง Git repository
   git init
   git add .
   git commit -m "Initial commit"
   
   # สร้าง Heroku app
   heroku create kleara-clinic-backend
   
   # เพิ่ม MongoDB Atlas
   # ใช้ Connection String จาก Atlas แทน local MongoDB
   heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/kleara_clinic"
   heroku config:set JWT_SECRET="your-secret-key"
   heroku config:set NODE_ENV="production"
   
   # Deploy
   git push heroku main
   ```

5. **Deploy Frontend (ใช้ Vercel - ฟรี)**
   - ไปที่ https://vercel.com/signup
   - เชื่อมต่อกับ GitHub
   - Import project
   - ตั้งค่า Environment Variable:
     ```
     REACT_APP_API_URL=https://kleara-clinic-backend.herokuapp.com
     ```
   - Deploy!

---

#### **ตัวเลือกที่ 3: Deploy บน Cloud Platforms**

**Backend:** Railway.app, Render.com (ฟรี)
**Frontend:** Vercel, Netlify (ฟรี)
**Database:** MongoDB Atlas (ฟรี)

---

## 4. การแก้ไขปัญหาที่พบบ่อย

### ❌ ปัญหา: Backend ไม่ทำงาน
**อาการ:** Server ไม่ start หรือ error

**วิธีแก้:**
1. ตรวจสอบว่าติดตั้ง packages ครบ:
   ```powershell
   cd "c:\Clinic System\server"
   npm install
   ```

2. ตรวจสอบ MongoDB ทำงานหรือไม่:
   ```powershell
   # ถ้าใช้ local MongoDB
   mongod --version
   ```

3. ตรวจสอบ Port 5000 ว่าถูกใช้งานหรือไม่:
   ```powershell
   netstat -ano | findstr :5000
   ```
   ถ้ามี process อื่นใช้ ให้ kill:
   ```powershell
   taskkill /PID <PID_NUMBER> /F
   ```

### ❌ ปัญหา: Frontend ไม่แสดงข้อมูล
**อาการ:** หน้าเว็บเปิดได้ แต่ไม่มีข้อมูล

**วิธีแก้:**
1. เช็ค Console ใน Browser (กด F12)
2. ดูว่ามี API call error หรือไม่
3. ตรวจสอบว่า Backend ทำงานที่ port 5000:
   ```
   http://localhost:5000/api/auth/me
   ```

### ❌ ปัญหา: Cannot connect to MongoDB
**วิธีแก้:**
1. ตรวจสอบ Connection String ใน `.env`
2. ถ้าใช้ Atlas: ตรวจสอบว่า IP Address ถูก whitelist แล้ว
3. ตรวจสอบ username/password ถูกต้อง

### ❌ ปัญหา: CORS Error
**วิธีแก้:**
ตรวจสอบว่า Backend มี CORS middleware:
```javascript
// ใน server/app.js
const cors = require('cors');
app.use(cors());
```

---

## 📞 ติดต่อขอความช่วยเหลือ

หากมีปัญหาหรือข้อสงสัย สามารถเช็คได้ที่:
- Documentation: อ่านไฟล์ README.md
- Issues: ตรวจสอบ error messages ใน Console

---

## ✅ Checklist ก่อน Deploy Production

- [ ] ทดสอบทุกฟีเจอร์ใน Development
- [ ] เปลี่ยน JWT_SECRET เป็นค่าใหม่ (อย่าใช้ค่าเดิม)
- [ ] ตั้งค่า MongoDB Atlas (ไม่ควรใช้ local MongoDB ใน production)
- [ ] เปิด HTTPS (SSL Certificate)
- [ ] ตั้งค่า Backup Database อัตโนมัติ
- [ ] เซ็ต Environment Variables ให้ถูกต้อง
- [ ] ทดสอบ Performance (Load Testing)
- [ ] เตรียม Error Monitoring (เช่น Sentry)

---

🎉 **ขอให้ Deploy สำเร็จ!**
