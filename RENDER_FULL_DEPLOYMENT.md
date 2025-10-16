# 🎯 Deploy ทั้ง Client + Server บน Render.com

## ข้อดีของการใช้ Render ทั้งหมด:
✅ จัดการรวมกันที่เดียว (1 dashboard)
✅ ไม่มีปัญหา CORS แบบ Vercel
✅ SSL/HTTPS ฟรีทั้งสองฝั่ง
✅ Environment variables จัดการง่าย
✅ Auto-deploy เมื่อ push GitHub
✅ Free tier เพียงพอสำหรับ development

---

## 📋 สถานะปัจจุบัน

✅ Code push ขึ้น GitHub สำเร็จ
- Repository: https://github.com/facexerciseclinic-cloud/kleara-clinic

⏳ ต้อง Deploy 2 Services:
1. **Web Service** (Backend) - Node.js Express
2. **Static Site** (Frontend) - React Build

---

## 🚀 ขั้นตอน Deploy (5 นาที)

### 1️⃣ Deploy Backend (Web Service)

**ไปที่:** https://dashboard.render.com

**สร้าง Web Service:**
```
New + → Web Service → Connect GitHub → เลือก kleara-clinic

▼ Configuration:
Name: kleara-clinic-api
Region: Singapore
Branch: main
Root Directory: server          👈 สำคัญ!
Runtime: Node
Build Command: npm install
Start Command: node app.js
Instance Type: Free
```

**Add Environment Variables (8 ตัว):**
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

**Deploy!** → รอ 2-3 นาที → จะได้ URL: `https://kleara-clinic-api.onrender.com`

---

### 2️⃣ Deploy Frontend (Static Site)

**สร้าง Static Site:**
```
New + → Static Site → Connect GitHub → เลือก kleara-clinic

▼ Configuration:
Name: kleara-clinic-client
Branch: main
Root Directory: client          👈 สำคัญ!
Build Command: npm install && npm run build
Publish Directory: build
```

**Add Environment Variable (1 ตัว):**
```env
REACT_APP_API_URL=https://kleara-clinic-api.onrender.com/api
```

**Deploy!** → รอ 3-5 นาที → จะได้ URL: `https://kleara-clinic-client.onrender.com`

---

## 🔄 Update Backend CORS

หลังจาก client deploy แล้ว ต้องไป **update Environment Variable** ของ Backend:

**ใน Web Service (kleara-clinic-api):**
```
Environment → Edit FRONTEND_URL
เปลี่ยนเป็น: https://kleara-clinic-client.onrender.com
→ Save Changes
```

Render จะ redeploy อัตโนมัติ (1-2 นาที)

---

## 📊 ผลลัพธ์ที่ได้

✅ **Backend API**: https://kleara-clinic-api.onrender.com
✅ **Frontend**: https://kleara-clinic-client.onrender.com

### Test URLs:
```
Backend Health: https://kleara-clinic-api.onrender.com/api/health
Frontend Login: https://kleara-clinic-client.onrender.com/login
```

---

## ⚠️ หมายเหตุสำคัญ

### Free Tier Limitations:
- ⏱️ **Cold Start**: Service จะ sleep หลังไม่มีใช้งาน 15 นาที
- 🐌 **First Load**: ครั้งแรกจะช้า 30-60 วินาที (wake up)
- ⏰ **750 Hours/month**: พอสำหรับ development

### Upgrade ถ้าต้องการ:
- 💰 **$7/month**: No sleep, faster, 24/7 online
- 🚀 **$25/month**: Better performance, more RAM

---

## 🎯 Checklist Deploy

### Backend (Web Service):
- [ ] Name: kleara-clinic-api
- [ ] Root Directory: `server`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node app.js`
- [ ] Environment Variables: 8 ตัว
- [ ] Deploy → รอให้ขึ้น "Live"

### Frontend (Static Site):
- [ ] Name: kleara-clinic-client
- [ ] Root Directory: `client`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `build`
- [ ] Environment Variable: REACT_APP_API_URL
- [ ] Deploy → รอให้ขึ้น "Live"

### Update Backend:
- [ ] Edit FRONTEND_URL → ใส่ client URL
- [ ] Save → รอ redeploy

---

## 🧪 Testing

หลัง deploy ทั้งสองฝั่ง:

1. **Test Backend:**
   ```
   https://kleara-clinic-api.onrender.com/api/health
   ```
   ต้องเห็น: `{"status":"ok","timestamp":"..."}`

2. **Test Frontend:**
   ```
   https://kleara-clinic-client.onrender.com
   ```
   ต้องเห็นหน้า Login

3. **Test Login:**
   - เปิด Frontend URL
   - Login ด้วย admin account
   - ต้องเข้าได้ปกติ

4. **Test Features:**
   - ✅ Patient Portal
   - ✅ Loyalty Points
   - ✅ Referral Program

---

## 💡 Tips

### Auto-Deploy:
- Push code ใหม่ → Render จะ deploy อัตโนมัติ
- ดูสถานะใน Dashboard

### Logs:
- เข้า Service → Logs → ดู real-time logs
- Debug ปัญหาได้ทันที

### Custom Domain (ถ้าต้องการ):
- Settings → Custom Domain
- เชื่อม domain ของคุณ (ฟรี!)

---

## 🆘 Troubleshooting

### Problem: Build Failed
**Solution:** ตรวจสอบ Root Directory ให้ถูกต้อง

### Problem: Client ไม่ติดต่อ Server ได้
**Solution:** ตรวจสอบ REACT_APP_API_URL และ FRONTEND_URL

### Problem: CORS Error
**Solution:** Update FRONTEND_URL ใน Backend environment variables

### Problem: Cold Start ช้า
**Solution:** Upgrade plan หรือรอ 30-60 วินาที ครั้งแรก

---

## ✅ พร้อมแล้ว!

บอกผมได้เลยเมื่อ:
- 🟢 Backend deploy สำเร็จ
- 🟢 Frontend deploy สำเร็จ
- ❌ เจอปัญหาใดๆ

ผมพร้อมช่วยแก้ทันที! 🚀
