# 🔧 แก้ปัญหา Server Timeout บน Render

## ปัญหาที่เจอ:
```
✅ Build successful
✅ Uploaded in 4.8s
🔄 Deploying...
❌ Timed Out (หลัง 15 นาที)
```

## สาเหตุที่เป็นไปได้:

### 1. MongoDB Connection Timeout (มักเจอที่สุด)
**อาการ:** Server start แต่ไม่ respond health check เพราะรอ MongoDB

**วิธีแก้:**
- ✅ เพิ่ม connection timeout: `serverSelectionTimeoutMS: 5000`
- ✅ Handle connection error แบบ graceful
- ✅ ไม่ให้ app crash ถ้า MongoDB ไม่ติด

### 2. Environment Variables ไม่ครบ
**ต้องมีครบทั้ง 8 ตัว:**

```env
MONGODB_URI=mongodb+srv://kleara_admin:Kleara2025!@kleara-clinic.khhfz8j.mongodb.net/kleara_clinic?retryWrites=true&w=majority&appName=kleara-clinic

JWT_SECRET=kleara-clinic-secret-key-2025-production

REFRESH_TOKEN_SECRET=kleara-refresh-token-secret-2025-production

NODE_ENV=production

FRONTEND_URL=https://kleara-clinic-client.onrender.com

PORT=5002

RATE_LIMIT_MAX=100

RATE_LIMIT_WINDOW=15
```

### 3. Health Check Path ผิด
**Render Settings:**
- Health Check Path: `/api/health` ✅
- Health Check Enabled: **Yes**

### 4. Start Command ผิด
**Render Settings:**
- Start Command: `node app.js` ✅

---

## 🎯 ขั้นตอนแก้ไข

### Step 1: ตรวจสอบ Environment Variables
1. ไปที่ Render Dashboard
2. เลือก `kleara-clinic-api` service
3. คลิก **Environment**
4. **เช็คว่ามีครบ 8 ตัว** (ตามด้านบน)
5. ถ้าไม่ครบ → Add ให้ครบ → **Save Changes**

### Step 2: ตรวจสอบ Settings
1. คลิก **Settings**
2. เช็ค:
   ```
   Root Directory: server
   Build Command: npm install
   Start Command: node app.js
   Health Check Path: /api/health
   ```

### Step 3: Manual Deploy (หลัง push code ใหม่)
1. ไปที่ **Manual Deploy**
2. เลือก branch `main`
3. คลิก **Deploy**
4. ดู logs real-time

---

## 📊 สิ่งที่ควรเห็นใน Logs (ถ้าสำเร็จ):

```
==> Running build command 'npm install'...
added X packages in Ys

==> Uploading build...
==> Build successful 🎉

==> Deploying...
🔄 Attempting MongoDB connection...
✅ MongoDB Connected successfully
📊 Database ready
🏥 Kleara Clinic Management Server running on port 10000
🌐 Environment: production
📱 Health Check: http://localhost:10000/api/health
✅ Server is ready to accept connections

==> Live ✅
```

---

## 🐛 Debugging

### ถ้ายัง Timeout:

#### 1. เช็ค MongoDB Connection
- ไปที่ MongoDB Atlas
- **Network Access** → ตรวจสอบว่า IP Whitelist
- ต้องมี `0.0.0.0/0` (Allow from anywhere)

#### 2. เช็ค MongoDB Credentials
- Username: `kleara_admin`
- Password: `Kleara2025!`
- Database: `kleara_clinic`
- ลอง test connection: https://www.mongodb.com/products/tools/compass

#### 3. ลดขนาด Routes (ถ้าจำเป็น)
ถ้า server ใช้เวลา start นาน อาจเป็นเพราะ load routes เยอะ

---

## 🚨 Emergency Fix: Bypass MongoDB

ถ้าต้องการให้ server อยู่ live ก่อน แม้ MongoDB ไม่ติด:

```javascript
// ใน app.js - ปรับให้ไม่ block ถ้า MongoDB fail
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('⚠️  MongoDB Error:', err.message);
    console.log('⚠️  Server will continue without database');
    // Don't exit - let server run
  });
```

✅ แก้ไปแล้วใน commit ล่าสุด!

---

## 📝 Checklist

- [ ] Environment variables ครบ 8 ตัว
- [ ] MongoDB Atlas Network Access = `0.0.0.0/0`
- [ ] Health Check Path = `/api/health`
- [ ] Root Directory = `server`
- [ ] Start Command = `node app.js`
- [ ] Code push ล่าสุด (45879d2)
- [ ] Manual Deploy → ดู logs

---

## ✅ Next Steps

1. **ไปที่ Render Dashboard**
2. เลือก `kleara-clinic-api`
3. คลิก **Manual Deploy**
4. เลือก branch `main`
5. **Deploy** → ดู logs
6. รอ 2-3 นาที
7. ควรเห็น **Live** ✅

---

## 📞 หากยังไม่ได้

บอกผมได้เลยว่า:
1. Environment variables มีครบไหม?
2. Logs แสดงอะไรบ้าง? (copy มาให้ดูได้)
3. MongoDB Atlas Network Access เป็นยังไง?

ผมจะช่วยแก้ต่อครับ! 🚀
