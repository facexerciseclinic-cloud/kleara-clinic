# 🏥 Kleara Clinic Management System

> ระบบจัดการคลินิกความงามแบบครบวงจร พร้อม Deploy บน Vercel!

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-green)](https://www.mongodb.com/cloud/atlas)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%2022-green)](https://nodejs.org/)

---

## 🚀 Quick Start (15 นาที!)

```bash
# 1. Clone หรือ download project
cd "C:\Clinic System"

# 2. Deploy ง่าย ๆ
.\deploy.ps1

# หรือดูคู่มือเต็ม:
```

📖 **[QUICK_START.md](./QUICK_START.md)** - Deploy ใน 15 นาที!
📖 **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - คู่มือ Deploy แบบละเอียด

---

## 🎯 ภาพรวมระบบ

ระบบจัดการคลินิกที่พัฒนาด้วย **React + TypeScript + Material-UI** (Frontend) และ **Node.js + Express + MongoDB** (Backend) ครอบคลุมการทำงานทุกด้านของคลินิกความงาม

**🌐 Demo:** https://kleara-clinic.vercel.app *(เร็ว ๆ นี้)*

---

## ✨ ฟีเจอร์ครบครัน (9 ระบบหลัก + 15 APIs)

### 🎯 Core Features

### 1. 👤 Patient Management (การจัดการผู้ป่วย)
- ✅ เพิ่ม/แก้ไข/ค้นหาข้อมูลผู้ป่วย
- ✅ บันทึกประวัติการรักษา
- ✅ ระบบ Membership และ Loyalty Points
- ✅ Online Booking Integration
- ✅ API: `/api/patients`

### 2. � Appointment System (ระบบนัดหมาย)
- ✅ จองนัดหมายออนไลน์
- ✅ Calendar View (รายวัน/สัปดาห์/เดือน)
- ✅ ตรวจสอบช่วงเวลาว่าง
- ✅ SMS/LINE Reminder
- ✅ 8 endpoints ใหม่
- ✅ API: `/api/appointments/*`

### 3. � Treatment System (การรักษา)
- ✅ บันทึกการรักษา
- ✅ ค้นหาประวัติการรักษา
- ✅ Service Management
- ✅ Before/After Photos
- ✅ API: `/api/treatments`

### 4. 💰 Billing & POS (การเงิน)
- ✅ ระบบขายสินค้า/บริการ
- ✅ Payment Gateway (GBPrimePay)
- ✅ PromptPay QR Code
- ✅ สรุปรายรับ-รายจ่าย
- ✅ API: `/api/billing`, `/api/payment`

### 5. � Inventory Management (สินค้าคงคลัง)
- ✅ Stock-in/Stock-out
- ✅ Low Stock Alerts
- ✅ Auto-reorder
- ✅ Supplier Management
- ✅ API: `/api/inventory`

### 6. � Staff Management (บุคลากร)
- ✅ User Roles (Admin/Doctor/Nurse/Receptionist)
- ✅ Schedule Management
- ✅ Performance Tracking
- ✅ Permissions
- ✅ API: `/api/staff`

### 7. � Dashboard
- ✅ Real-time Statistics
- ✅ Revenue Charts
- ✅ Appointment Overview
- ✅ Notifications
- ✅ API: `/api/analytics/dashboard`

### 8. 📈 Reports & Analytics (รายงานขั้นสูง)
- ✅ Revenue Analytics (รายได้ตามช่วงเวลา)
- ✅ Customer Retention (อัตราการกลับมา, Churn Rate, LTV)
- ✅ Inventory Reports (มูลค่า, Fast/Slow Moving)
- ✅ Staff Performance (ยอดขาย, จำนวนนัดหมาย)
- ✅ Predictive Analytics (ทำนายความต้องการ)
- ✅ Export CSV
- ✅ API: `/api/reports`, `/api/analytics/*` (7 endpoints)

### 🌟 Modern Features (ระบบใหม่!)

### 9. 📱 LINE Official Account Integration
- ✅ ส่งข้อความถึงลูกค้า
- ✅ Push Notifications
- ✅ Rich Menu Management
- ✅ Webhook Support
- ✅ API: `/api/line/*`

### 10. 💳 Payment Gateway (GBPrimePay)
- ✅ PromptPay QR Code
- ✅ Credit/Debit Card
- ✅ Installment
- ✅ Payment Verification
- ✅ API: `/api/payment/*`

### 11. 📲 SMS Notifications (ThaisBulkSMS)
- ✅ Appointment Reminders
- ✅ Marketing Campaigns
- ✅ OTP Verification
- ✅ Delivery Status Tracking
- ✅ API: `/api/sms/*`

### 12. ☁️ Cloud Storage (AWS S3 / Google Cloud)
- ✅ Multi-provider Support (Local/S3/GCS)
- ✅ Upload Single/Multiple Files
- ✅ Signed URLs (secure access)
- ✅ File Management
- ✅ API: `/api/storage/*`

### 13. 🎁 Package & Course System
- ✅ Treatment Packages
- ✅ Membership Programs (Bronze/Silver/Gold/Platinum/Diamond)
- ✅ Course Management
- ✅ Vouchers
- ✅ Usage Tracking
- ✅ Auto-expiry
- ✅ API: `/api/packages/*` (11 endpoints)

### 14. 🔔 Notifications
- ✅ ระบบแจ้งเตือนแบบ Real-time
- ✅ Mark as read/unread
- ✅ Notification center

### 9. 🚀 Modern Integrations (NEW!)
- ✅ **LINE API** - แจ้งเตือนนัดหมาย, LINE Notify, LINE Messaging
- ✅ **Payment Gateway** - PromptPay QR, Credit Card (Omise), Installment, 2C2P
- ✅ **SMS Integration** - OTP, การยืนยันนัดหมาย, แจ้งเตือนอัตโนมัติ
- 📘 อ่านคู่มือเพิ่มเติม: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **React 19** + **TypeScript**
- **Material-UI v7** (Components, Theming)
- **React Router v7** (Navigation)
- **Axios** (HTTP Client)
- **Context API** (State Management)

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose** (Database)
- **JWT** (Authentication)
- **bcrypt** (Password Hashing)

---

## 🚀 เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น
- Node.js v16+ 
- MongoDB
- npm หรือ yarn

### ติดตั้งระบบ

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd "Clinic System"
   ```

2. **ติดตั้ง Backend**
   ```bash
   cd server
   npm install
   
   # สร้างไฟล์ .env
   cp .env.example .env
   # แก้ไข .env ตามความเหมาะสม
   
   # รัน server
   node app.js
   ```

3. **ติดตั้ง Frontend**
   ```bash
   cd client
   npm install
   
   # รัน client
   npm start
   ```

4. **เข้าใช้งาน**
   - เปิด browser: http://localhost:3000
   - Login: `admin` / `admin123`

---

## 📖 คู่มือเพิ่มเติม

- 📘 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - คู่มือ Deploy แบบละเอียด
- 🧪 **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - คู่มือทดสอบระบบ
- 🔌 **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - คู่มือการติดตั้ง LINE, Payment, SMS API

---

## 📁 โครงสร้างโปรเจค

```
Clinic System/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # Context providers
│   │   ├── services/      # API services
│   │   └── theme/         # MUI theme
│   └── package.json
│
├── server/                # Node.js Backend
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & other middleware
│   ├── app.js           # Express app
│   └── package.json
│
├── DEPLOYMENT_GUIDE.md   # คู่มือ Deploy
├── TESTING_GUIDE.md      # คู่มือทดสอบ
└── README.md            # ไฟล์นี้
```

---

## 🔐 การ Authentication

ระบบใช้ **JWT (JSON Web Tokens)** สำหรับการยืนยันตัวตน:
- Login ด้วย username/password
- Server สร้าง JWT token
- Client เก็บ token ใน localStorage
- ส่ง token ใน Authorization header ทุก request

---

## 🎨 UI/UX Features

- ✅ Modern & Clean Design
- ✅ Responsive (Desktop, Tablet, Mobile)
- ✅ Dark/Light Mode Support (ถ้ามี)
- ✅ Loading States
- ✅ Error Handling
- ✅ Toast Notifications
- ✅ Modal Dialogs
- ✅ Form Validation

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient

### Inventory
- `GET /api/inventory/products` - Get products
- `POST /api/inventory/products` - Add product
- `PUT /api/inventory/products/:id` - Update product
- `POST /api/inventory/movements` - Stock movement
- `GET /api/inventory/reports` - Inventory reports
- `POST /api/inventory/purchase-orders` - Create PO

### Staff
- `GET /api/staff` - Get staff list
- `POST /api/staff` - Add staff
- `PUT /api/staff/:id` - Update staff
- `GET /api/staff/:id/schedule` - Get schedule
- `PUT /api/staff/:id/schedule` - Update schedule
- `GET /api/staff/:id/permissions` - Get permissions
- `PUT /api/staff/:id/permissions` - Update permissions
- `POST /api/staff/:id/evaluations` - Create evaluation
- `GET /api/staff/:id/evaluations` - Get evaluations

### LINE Integration (NEW!)
- `POST /api/line/notify` - Send LINE Notify message
- `POST /api/line/push` - Send LINE push message
- `POST /api/line/appointment-reminder` - Send appointment reminder
- `POST /api/line/webhook` - LINE webhook (for receiving messages)
- `GET /api/line/profile/:userId` - Get LINE user profile

### Payment Gateway (NEW!)
- `POST /api/payment/promptpay` - Generate PromptPay QR Code
- `POST /api/payment/omise/charge` - Process credit card payment (Omise)
- `POST /api/payment/omise/installment` - Process installment payment
- `POST /api/payment/2c2p/charge` - Process payment via 2C2P
- `GET /api/payment/status/:transactionId` - Check payment status
- `POST /api/payment/webhook` - Payment webhook callback

### SMS Integration (NEW!)
- `POST /api/sms/send-otp` - Send OTP via SMS
- `POST /api/sms/verify-otp` - Verify OTP
- `POST /api/sms/send-reminder` - Send appointment reminder
- `POST /api/sms/send-notification` - Send custom notification
- `POST /api/sms/bulk-send` - Send SMS to multiple recipients
- `POST /api/staff` - Add staff
- `PUT /api/staff/:id` - Update staff
- `GET /api/staff/:id/schedule` - Get schedule
- `PUT /api/staff/:id/schedule` - Update schedule
- `GET /api/staff/:id/permissions` - Get permissions
- `PUT /api/staff/:id/permissions` - Update permissions
- `POST /api/staff/:id/evaluations` - Create evaluation

---

## 🐛 Troubleshooting

### Backend ไม่ start
- ✅ ตรวจสอบ MongoDB ทำงานหรือไม่
- ✅ ตรวจสอบ .env file ครบถ้วน
- ✅ ตรวจสอบ Port 5000 ว่าง

### Frontend ไม่แสดงข้อมูล
- ✅ ตรวจสอบ Backend ทำงาน (http://localhost:5000)
- ✅ เช็ค Console ใน DevTools (F12)
- ✅ ตรวจสอบ API endpoint ถูกต้อง

### CORS Error
- ✅ ตรวจสอบ CORS middleware ใน Backend
- ✅ ตรวจสอบ API URL ใน Frontend

---

## 🔜 Roadmap

### Phase 1 (✅ เสร็จแล้ว)
- ✅ Patient Management with API
- ✅ Inventory Management with full features
- ✅ Staff Management with advanced features
- ✅ Dashboard & Analytics
- ✅ Authentication & Authorization

### Phase 2 (📝 กำลังพัฒนา)
- 📅 Appointment Scheduling System
- 💳 Payment Integration
- 📱 LINE/SMS Notifications
- 📊 Advanced Analytics & Charts

### Phase 3 (🔮 แผนอนาคต)
- 🌐 Multi-language Support
- 📱 Mobile App (React Native)
- 🤖 AI-powered Analytics
- ☁️ Cloud Storage Integration

---

## 👨‍💻 สำหรับ Developers

### การเพิ่มฟีเจอร์ใหม่

1. **Backend API:**
   ```bash
   # สร้าง route ใหม่ใน server/routes/
   # เพิ่ม endpoint ใน app.js
   ```

2. **Frontend Page:**
   ```bash
   # สร้าง component ใน client/src/pages/
   # เพิ่ม route ใน App.tsx
   ```

### Code Style
- TypeScript for type safety
- Async/await for asynchronous code
- Material-UI components
- React Hooks (useState, useEffect, useContext)

---

## 📄 License

MIT License - สามารถนำไปใช้และแก้ไขได้ตามต้องการ

---

## 🙏 Credits

พัฒนาโดย: Kleara Clinic Team
เทคโนโลยี: MERN Stack (MongoDB, Express, React, Node.js)

---

## 📞 ติดต่อ

- Website: https://kleara-clinic.com
- Email: info@kleara-clinic.com
- GitHub: [Repository URL]

---

**🎉 ขอให้ใช้งานระบบได้อย่างมีประสิทธิภาพ!**
- Operational statistics
- Real-time dashboard

### 8. External Integrations
- LINE Official Account
- Accounting software export
- Payment gateway integration

## Technology Stack
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js with Material-UI
- **Authentication**: JWT with role-based access
- **Real-time**: Socket.io
- **File Storage**: Multer for file uploads
- **Security**: Helmet, CORS, Rate limiting

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Set up environment variables (see .env.example)
4. Start the development server:
   ```bash
   npm run dev
   ```

## Security & Compliance
- PDPA compliant data handling
- Encrypted sensitive data storage
- Audit trails for all data access
- Role-based access control

## Mobile Support
Optimized for tablet and mobile use, especially for doctors using the system in treatment rooms.

## License
MIT License